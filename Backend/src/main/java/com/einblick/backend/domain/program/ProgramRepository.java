package com.einblick.backend.domain.program;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    Optional<Program> findByStyleCodeAndSeason(String styleCode, String season);
    Optional<Program> findFirstByStyleCode(String styleCode);
}
