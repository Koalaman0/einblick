package com.einblick.backend.domain.techpack;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.UncheckedIOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/techpack-files")
public class TechPackFileController {

    private final TechPackFileService techPackFileService;

    public TechPackFileController(TechPackFileService techPackFileService) {
        this.techPackFileService = techPackFileService;
    }

    @GetMapping
    public List<TechPackFileResponse> list() {
        return techPackFileService.list();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TechPackFileResponse> upload(
        @RequestParam Long programId,
        @RequestParam TechPackFile.Type fileType,
        @RequestParam MultipartFile file
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(techPackFileService.upload(programId, fileType, file));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        TechPackFile file = techPackFileService.getOrThrow(id);
        String encodedName = URLEncoder.encode(file.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
            .contentType(file.getContentType() != null ? MediaType.parseMediaType(file.getContentType()) : MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
            .body(file.getFileData());
    }

    @PatchMapping("/{id}/status")
    public TechPackFileResponse updateStatus(@PathVariable Long id, @Valid @RequestBody TechPackStatusUpdateRequest request) {
        return techPackFileService.updateStatus(id, request);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(UncheckedIOException.class)
    public ResponseEntity<ErrorResponse> handleIOException(UncheckedIOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
