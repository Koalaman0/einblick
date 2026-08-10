package com.einblick.backend.domain.po;

import com.einblick.backend.domain.program.Program;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    boolean existsByPoNumber(String poNumber);
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
    List<PurchaseOrder> findByProgram(Program program);
}
