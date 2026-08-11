package com.einblick.backend.domain.reconciliation;

import com.einblick.backend.domain.po.PoLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReconciliationResultRepository extends JpaRepository<ReconciliationResult, Long> {
    void deleteByPoLineIn(List<PoLine> poLines);
}
