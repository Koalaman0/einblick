package com.einblick.backend.domain.assort;

import com.einblick.backend.domain.program.Program;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssortRepository extends JpaRepository<Assort, Long> {
    List<Assort> findByProgram(Program program);
}
