package com.einblick.backend.domain.sample;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SampleRepository extends JpaRepository<Sample, Long> {
    List<Sample> findAllByOrderByCreatedAtDesc();
}
