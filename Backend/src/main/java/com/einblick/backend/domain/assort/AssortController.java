package com.einblick.backend.domain.assort;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/assort")
public class AssortController {

    private final AssortService assortService;
    private final AssortExcelImportService assortExcelImportService;

    public AssortController(AssortService assortService, AssortExcelImportService assortExcelImportService) {
        this.assortService = assortService;
        this.assortExcelImportService = assortExcelImportService;
    }

    @PostMapping
    public ResponseEntity<AssortResponse> create(@Valid @RequestBody AssortCreateRequest request) {
        Assort saved = assortService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(AssortResponse.from(saved));
    }

    @PostMapping("/upload")
    public ResponseEntity<AssortBatchImportResponse> upload(@RequestParam MultipartFile file) {
        AssortExcelImportService.ImportResult result = assortExcelImportService.importExcel(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(AssortBatchImportResponse.from(result));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(AssortImportException.class)
    public ResponseEntity<ErrorResponse> handleImportError(AssortImportException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
