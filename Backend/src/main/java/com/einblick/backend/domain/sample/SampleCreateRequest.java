package com.einblick.backend.domain.sample;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SampleCreateRequest(
    @NotNull Long programId,
    @NotNull Sample.Type type,
    LocalDate dueDate,
    String commentSource
) {}
