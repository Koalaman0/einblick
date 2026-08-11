package com.einblick.backend.domain.po;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record PoLineSizeCreateRequest(
    @NotBlank String sizeCode,
    @NotNull @PositiveOrZero Integer qty
) {}
