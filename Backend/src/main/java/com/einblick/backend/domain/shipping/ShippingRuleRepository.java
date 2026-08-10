package com.einblick.backend.domain.shipping;

import com.einblick.backend.domain.program.Program;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShippingRuleRepository extends JpaRepository<ShippingRule, Long> {
    List<ShippingRule> findByProgram(Program program);
}
