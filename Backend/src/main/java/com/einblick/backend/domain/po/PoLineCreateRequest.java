package com.einblick.backend.domain.po;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PoLineCreateRequest(
    String team,
    String player,
    @NotEmpty @Valid List<PoLineSizeCreateRequest> sizes
) {}
