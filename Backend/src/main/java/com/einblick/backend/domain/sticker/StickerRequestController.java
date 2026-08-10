package com.einblick.backend.domain.sticker;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sticker-requests")
public class StickerRequestController {

    private final StickerRequestService stickerRequestService;

    public StickerRequestController(StickerRequestService stickerRequestService) {
        this.stickerRequestService = stickerRequestService;
    }

    @GetMapping
    public List<StickerRequestResponse> list() {
        return stickerRequestService.list();
    }

    @PostMapping
    public ResponseEntity<StickerRequestResponse> create(@Valid @RequestBody StickerRequestCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stickerRequestService.create(request));
    }

    @PatchMapping("/{id}/status")
    public StickerRequestResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StickerRequestStatusUpdateRequest request) {
        return stickerRequestService.updateStatus(id, request);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
