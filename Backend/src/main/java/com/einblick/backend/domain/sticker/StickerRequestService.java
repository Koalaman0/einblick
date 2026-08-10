package com.einblick.backend.domain.sticker;

import com.einblick.backend.domain.po.PurchaseOrder;
import com.einblick.backend.domain.po.PurchaseOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class StickerRequestService {

    private final StickerRequestRepository stickerRequestRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public StickerRequestService(StickerRequestRepository stickerRequestRepository, PurchaseOrderRepository purchaseOrderRepository) {
        this.stickerRequestRepository = stickerRequestRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    public List<StickerRequestResponse> list() {
        return stickerRequestRepository.findAllByOrderByIdDesc().stream()
            .map(StickerRequestResponse::from)
            .toList();
    }

    @Transactional
    public StickerRequestResponse create(StickerRequestCreateRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findById(request.poId())
            .orElseThrow(() -> new EntityNotFoundException("PO를 찾을 수 없습니다: " + request.poId()));

        StickerRequest stickerRequest = StickerRequest.builder()
            .purchaseOrder(po)
            .stickerType(request.stickerType())
            .qty(request.qty())
            .lossRate(request.lossRate() != null ? request.lossRate() : new BigDecimal("1.00"))
            .build();

        return StickerRequestResponse.from(stickerRequestRepository.save(stickerRequest));
    }

    @Transactional
    public StickerRequestResponse updateStatus(Long id, StickerRequestStatusUpdateRequest request) {
        StickerRequest stickerRequest = stickerRequestRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("스티커 요청을 찾을 수 없습니다: " + id));
        stickerRequest.updateStatus(request.status());
        return StickerRequestResponse.from(stickerRequest);
    }
}
