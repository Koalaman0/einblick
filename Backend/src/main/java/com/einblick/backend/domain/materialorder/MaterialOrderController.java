package com.einblick.backend.domain.materialorder;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/material-orders")
public class MaterialOrderController {

    private final MaterialOrderService materialOrderService;

    public MaterialOrderController(MaterialOrderService materialOrderService) {
        this.materialOrderService = materialOrderService;
    }

    @GetMapping
    public List<MaterialOrderResponse> list() {
        return materialOrderService.list();
    }

    @PostMapping
    public ResponseEntity<MaterialOrderResponse> create(@Valid @RequestBody MaterialOrderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(materialOrderService.create(request));
    }

    @PostMapping("/{id}/advance-approval")
    public MaterialOrderResponse advanceApproval(@PathVariable Long id) {
        return materialOrderService.advanceApproval(id);
    }

    @PostMapping("/{id}/reject")
    public MaterialOrderResponse reject(@PathVariable Long id) {
        return materialOrderService.reject(id);
    }

    @PostMapping("/{id}/advance-wire")
    public MaterialOrderResponse advanceWire(@PathVariable Long id) {
        return materialOrderService.advanceWire(id);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidTransition(IllegalStateException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
