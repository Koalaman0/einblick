package com.einblick.backend.domain.po;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        purchaseOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<PoBulkDeleteResponse> bulkDelete(@Valid @RequestBody PoBulkDeleteRequest request) {
        int deleted = 0;
        List<String> failures = new ArrayList<>();
        // 각 건을 purchaseOrderService.delete(id)로 개별 호출해서 프록시를 거치게 하고(같은 클래스
        // 내부 호출은 @Transactional이 안 먹으므로), 한 건이 실패해도 나머지는 계속 처리한다.
        for (Long id : request.ids()) {
            try {
                purchaseOrderService.delete(id);
                deleted++;
            } catch (EntityNotFoundException e) {
                failures.add(e.getMessage());
            }
        }
        return ResponseEntity.ok(new PoBulkDeleteResponse(deleted, failures.size(), failures));
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
