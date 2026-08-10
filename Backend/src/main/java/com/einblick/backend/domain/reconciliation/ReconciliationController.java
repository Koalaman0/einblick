package com.einblick.backend.domain.reconciliation;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reconciliation")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;
    private final ReconciliationResultRepository reconciliationResultRepository;

    public ReconciliationController(
        ReconciliationService reconciliationService,
        ReconciliationResultRepository reconciliationResultRepository
    ) {
        this.reconciliationService = reconciliationService;
        this.reconciliationResultRepository = reconciliationResultRepository;
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
}
