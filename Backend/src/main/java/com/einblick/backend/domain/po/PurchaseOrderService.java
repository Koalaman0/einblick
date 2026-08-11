package com.einblick.backend.domain.po;

import com.einblick.backend.domain.customer.Customer;
import com.einblick.backend.domain.customer.CustomerRepository;
import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import com.einblick.backend.domain.reconciliation.ReconciliationResultRepository;
import com.einblick.backend.domain.sticker.StickerRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProgramRepository programRepository;
    private final CustomerRepository customerRepository;
    private final StickerRequestRepository stickerRequestRepository;
    private final ReconciliationResultRepository reconciliationResultRepository;

    public PurchaseOrderService(
        PurchaseOrderRepository purchaseOrderRepository,
        ProgramRepository programRepository,
        CustomerRepository customerRepository,
        StickerRequestRepository stickerRequestRepository,
        ReconciliationResultRepository reconciliationResultRepository
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.programRepository = programRepository;
        this.customerRepository = customerRepository;
        this.stickerRequestRepository = stickerRequestRepository;
        this.reconciliationResultRepository = reconciliationResultRepository;
    }

    @Transactional
    public PurchaseOrderSummaryResponse create(PoCreateRequest request) {
        if (purchaseOrderRepository.existsByPoNumber(request.poNumber())) {
            throw new PoCreateException("이미 등록된 PO 번호입니다: " + request.poNumber());
        }

        Program program = programRepository.findById(request.programId())
            .orElseThrow(() -> new EntityNotFoundException("스타일(PROGRAM)을 찾을 수 없습니다: " + request.programId()));

        Customer customer = request.customerId() != null
            ? customerRepository.findById(request.customerId())
                .orElseThrow(() -> new EntityNotFoundException("거래처를 찾을 수 없습니다: " + request.customerId()))
            : findOrCreateHouseCustomer();

        int grandTotalQty = request.lines().stream()
            .flatMap(line -> line.sizes().stream())
            .mapToInt(PoLineSizeCreateRequest::qty)
            .sum();

        PurchaseOrder po = PurchaseOrder.builder()
            .poNumber(request.poNumber())
            .program(program)
            .customer(customer)
            .dlvyDate(request.dlvyDate())
            .transportMethod(request.transportMethod())
            .totalQty(grandTotalQty)
            .build();

        for (PoLineCreateRequest lineRequest : request.lines()) {
            int lineTotal = lineRequest.sizes().stream().mapToInt(PoLineSizeCreateRequest::qty).sum();

            PoLine poLine = PoLine.builder()
                .team(lineRequest.team())
                .player(lineRequest.player())
                .totalQty(lineTotal)
                .build();

            for (PoLineSizeCreateRequest sizeRequest : lineRequest.sizes()) {
                poLine.addSize(PoLineSize.builder()
                    .sizeCode(sizeRequest.sizeCode())
                    .qty(sizeRequest.qty())
                    .build());
            }
            po.addPoLine(poLine);
        }

        return PurchaseOrderSummaryResponse.from(purchaseOrderRepository.save(po));
    }

    @Transactional
    public void delete(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("PO를 찾을 수 없습니다: " + id));

        // 이 PO에 딸린 스티커 요청/대사 결과부터 지워야 FK 제약에 안 걸리고,
        // PoLine/PoLineSize는 PurchaseOrder.poLines의 cascade+orphanRemoval로 자동 삭제된다.
        stickerRequestRepository.deleteByPurchaseOrder(po);
        reconciliationResultRepository.deleteByPoLineIn(po.getPoLines());
        purchaseOrderRepository.delete(po);
    }

    private Customer findOrCreateHouseCustomer() {
        return customerRepository.findByCode("HOUSE")
            .orElseGet(() -> customerRepository.save(
                Customer.builder().code("HOUSE").name("HOUSE").houseAlias(true).build()
            ));
    }
}
