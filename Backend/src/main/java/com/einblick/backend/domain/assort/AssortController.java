package com.einblick.backend.domain.assort;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assort")
public class AssortController {

    private final AssortService assortService;

    public AssortController(AssortService assortService) {
        this.assortService = assortService;
    }

    @PostMapping
    public ResponseEntity<AssortResponse> create(@Valid @RequestBody AssortCreateRequest request) {
        Assort saved = assortService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(AssortResponse.from(saved));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
