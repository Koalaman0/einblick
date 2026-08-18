package com.einblick.backend.domain.reconciliation;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/reconciliation")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;
    private final ReconciliationResultRepository reconciliationResultRepository;
    private final ReconciliationReportService reconciliationReportService;

    public ReconciliationController(
        ReconciliationService reconciliationService,
        ReconciliationResultRepository reconciliationResultRepository,
        ReconciliationReportService reconciliationReportService
    ) {
        this.reconciliationService = reconciliationService;
        this.reconciliationResultRepository = reconciliationResultRepository;
        this.reconciliationReportService = reconciliationReportService;
    }

    @PostMapping("/run")
    public List<ReconciliationResultResponse> run() {
        return reconciliationService.run().stream()
            .map(ReconciliationResultResponse::from)
            .toList();
    }

    @GetMapping
    public List<ReconciliationResultResponse> list() {
        return reconciliationResultRepository.findAll().stream()
            .map(ReconciliationResultResponse::from)
            .toList();
    }

    // 마지막 대사 실행 결과를 명세서 6장 양식의 .docx 보고서로 내려준다.
    @GetMapping("/report")
    public ResponseEntity<byte[]> report() {
        List<ReconciliationResult> results = reconciliationResultRepository.findAll();
        byte[] docx = reconciliationReportService.generate(results);
        String fileName = "PO-ASSORT_대사보고서_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".docx";
        String encodedName = java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
            .body(docx);
    }
}
