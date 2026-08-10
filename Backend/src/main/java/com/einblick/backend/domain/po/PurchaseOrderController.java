package com.einblick.backend.domain.po;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/po")
public class PurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseOrderController(PurchaseOrderRepository purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @GetMapping
    public List<PurchaseOrderSummaryResponse> list() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(PurchaseOrderSummaryResponse::from)
            .toList();
    }
}
