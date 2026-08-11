package com.einblick.backend.domain.program;

import jakarta.validation.constraints.NotBlank;

public record ProgramCreateRequest(
    @NotBlank String brand,
    String league,
    @NotBlank String styleCode,
    String styleName,
    String season
) {}
