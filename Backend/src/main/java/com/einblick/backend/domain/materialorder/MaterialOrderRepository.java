package com.einblick.backend.domain.materialorder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialOrderRepository extends JpaRepository<MaterialOrder, Long> {
    List<MaterialOrder> findAllByOrderByCreatedAtDesc();
}
