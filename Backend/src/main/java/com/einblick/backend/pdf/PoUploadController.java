package com.einblick.backend.pdf;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/po")
public class PoUploadController {

    private final PoPdfImportService poPdfImportService;

    public PoUploadController(PoPdfImportService poPdfImportService) {
        this.poPdfImportService = poPdfImportService;
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<PoBatchImportResponse> uploadPo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new PoPdfParseException("업로드된 파일이 비어 있습니다.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(poPdfImportService.importPdf(file));
    }

    @ExceptionHandler(PoPdfParseException.class)
    public ResponseEntity<ErrorResponse> handleParseError(PoPdfParseException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
