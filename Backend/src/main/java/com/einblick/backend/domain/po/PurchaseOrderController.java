package com.einblick.backend.domain.po;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/po")
public class PurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderRepository purchaseOrderRepository, PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    public List<PurchaseOrderSummaryResponse> list() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(PurchaseOrderSummaryResponse::from)
            .toList();
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderSummaryResponse> create(@Valid @RequestBody PoCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseOrderService.create(request));
    }

    @ExceptionHandler(PoCreateException.class)
    public ResponseEntity<ErrorResponse> handleCreateError(PoCreateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
