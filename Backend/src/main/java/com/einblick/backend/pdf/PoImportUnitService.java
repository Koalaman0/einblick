package com.einblick.backend.pdf;

import com.einblick.backend.domain.customer.Customer;
import com.einblick.backend.domain.customer.CustomerRepository;
import com.einblick.backend.domain.po.PoLine;
import com.einblick.backend.domain.po.PoLineSize;
import com.einblick.backend.domain.po.PurchaseOrder;
import com.einblick.backend.domain.po.PurchaseOrderRepository;
import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PO 1건을 파싱해서 저장하는 단위. PDF 한 장에 PO가 여러 개 묶여 있을 때 PoPdfImportService가
 * 이 메서드를 PO 개수만큼 반복 호출하는데, 각 PO를 독립된 트랜잭션으로 커밋해야 PO 하나가
 * 실패해도 이미 처리된 PO들이 롤백되지 않는다 (그래서 별도 빈으로 분리 - 같은 클래스 내부
 * 호출은 @Transactional 프록시를 안 타서 이렇게 분리해야 한다).
 */
@Service
public class PoImportUnitService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProgramRepository programRepository;
    private final CustomerRepository customerRepository;
    private final PoHeaderParser headerParser = new PoHeaderParser();
    private final ProdLineParser prodLineParser = new ProdLineParser();

    public PoImportUnitService(
        PurchaseOrderRepository purchaseOrderRepository,
        ProgramRepository programRepository,
        CustomerRepository customerRepository
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.programRepository = programRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public PurchaseOrder importOne(String headerPageText, String dataPagesText) {
        PoHeaderParser.PoHeader header = headerParser.parse(headerPageText);
        if (header.poNumber() == null) {
            throw new PoPdfParseException("PO NUMBER를 PDF에서 추출하지 못했습니다. 템플릿 형식을 확인해주세요.");
        }
        if (purchaseOrderRepository.existsByPoNumber(header.poNumber())) {
            throw new PoPdfParseException("이미 등록된 PO입니다: " + header.poNumber());
        }

        List<ProdLineParser.ProdLineRow> rows = prodLineParser.parse(dataPagesText);
        if (rows.isEmpty()) {
            throw new PoPdfParseException("사이즈별 수량 정보를 추출하지 못했습니다.");
        }

        Program program = findOrCreateProgram(header);
        Customer customer = findOrCreateHouseCustomer();

        int grandTotalQty = rows.stream().mapToInt(ProdLineParser.ProdLineRow::qty).sum();

        PurchaseOrder po = PurchaseOrder.builder()
            .poNumber(header.poNumber())
            .program(program)
            .customer(customer)
            .dlvyDate(header.xfactoryDate())
            .transportMethod(parseTransportMethod(header.transportMethod()))
            .totalQty(grandTotalQty)
            .originalPdfUrl(null) // 실제 파일 저장 경로 붙일 위치 (스토리지 연동 시 채울 것)
            .build();

        // 이 템플릿은 사이즈별로 행이 나뉘어 있고 팀은 전부 동일 -> team별로 묶어서 PoLine을 생성
        // (한 PO 안에 팀이 여러 개 섞인 경우도 이 로직이 자동으로 PoLine을 team 개수만큼 나눠서 만들어줌)
        Map<String, List<ProdLineParser.ProdLineRow>> byTeam = new HashMap<>();
        for (ProdLineParser.ProdLineRow row : rows) {
            byTeam.computeIfAbsent(row.team(), k -> new java.util.ArrayList<>()).add(row);
        }

        for (Map.Entry<String, List<ProdLineParser.ProdLineRow>> entry : byTeam.entrySet()) {
            int lineTotal = entry.getValue().stream().mapToInt(ProdLineParser.ProdLineRow::qty).sum();

            PoLine poLine = PoLine.builder()
                .team(entry.getKey())
                .totalQty(lineTotal)
                .build();

            // 같은 팀이라도 컬러웨이/고객코드가 다른 여러 행이 같은 사이즈로 나올 수 있는데,
            // PoLineSize는 (PO_LINE_ID, SIZE_CODE)가 유니크라 행마다 그대로 넣으면 중복키 충돌이 난다.
            // 같은 사이즈는 수량을 합산해 하나로 저장한다 (대사는 팀 단위 사이즈 합계만 보므로 의미 손실 없음).
            Map<String, Integer> qtyBySize = new java.util.LinkedHashMap<>();
            for (ProdLineParser.ProdLineRow row : entry.getValue()) {
                qtyBySize.merge(row.sizeCode(), row.qty(), Integer::sum);
            }
            for (Map.Entry<String, Integer> sizeEntry : qtyBySize.entrySet()) {
                PoLineSize size = PoLineSize.builder()
                    .sizeCode(sizeEntry.getKey())
                    .qty(sizeEntry.getValue())
                    .build();
                poLine.addSize(size);
            }
            po.addPoLine(poLine);
        }

        return purchaseOrderRepository.save(po);
    }

    private Program findOrCreateProgram(PoHeaderParser.PoHeader header) {
        return programRepository.findByStyleCodeAndSeason(header.styleCode(), header.season())
            .orElseGet(() -> programRepository.save(
                Program.builder()
                    .styleCode(header.styleCode())
                    .styleName(header.styleName())
                    .brand(header.brand())
                    .league(header.league())
                    .season(header.season())
                    .build()
            ));
    }

    private Customer findOrCreateHouseCustomer() {
        return customerRepository.findByCode("HOUSE")
            .orElseGet(() -> customerRepository.save(
                Customer.builder()
                    .code("HOUSE")
                    .name("HOUSE")
                    .houseAlias(true)
                    .build()
            ));
    }

    private PurchaseOrder.TransportMethod parseTransportMethod(String raw) {
        if (raw == null) return PurchaseOrder.TransportMethod.UNASSIGNED;
        try {
            return PurchaseOrder.TransportMethod.valueOf(raw);
        } catch (IllegalArgumentException e) {
            return PurchaseOrder.TransportMethod.UNASSIGNED;
        }
    }
}
