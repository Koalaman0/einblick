package com.einblick.backend.domain.sample;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/samples")
public class SampleController {

    private final SampleService sampleService;

    public SampleController(SampleService sampleService) {
        this.sampleService = sampleService;
    }

    @GetMapping
    public List<SampleResponse> list() {
        return sampleService.list();
    }

    @PostMapping
    public ResponseEntity<SampleResponse> create(@Valid @RequestBody SampleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sampleService.create(request));
    }

    @PatchMapping("/{id}/type")
    public SampleResponse updateType(@PathVariable Long id, @Valid @RequestBody SampleTypeUpdateRequest request) {
        return sampleService.updateType(id, request);
    }

    @PatchMapping("/{id}/status")
    public SampleResponse updateStatus(@PathVariable Long id, @Valid @RequestBody SampleStatusUpdateRequest request) {
        return sampleService.updateStatus(id, request);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
