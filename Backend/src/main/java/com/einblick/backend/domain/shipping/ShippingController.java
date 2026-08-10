package com.einblick.backend.domain.shipping;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

    private final ShippingService shippingService;

    public ShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    @GetMapping
    public List<ShippingResponse> list() {
        return shippingService.list();
    }

    @PatchMapping("/{poId}")
    public ShippingResponse register(@PathVariable Long poId, @Valid @RequestBody ShippingRegisterRequest request) {
        return shippingService.register(poId, request);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
