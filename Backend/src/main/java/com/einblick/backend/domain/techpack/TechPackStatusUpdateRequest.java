package com.einblick.backend.domain.techpack;

import jakarta.validation.constraints.NotNull;

public record TechPackStatusUpdateRequest(@NotNull TechPackFile.Status status) {}
