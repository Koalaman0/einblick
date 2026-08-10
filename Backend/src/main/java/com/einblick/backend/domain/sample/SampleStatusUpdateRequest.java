package com.einblick.backend.domain.sample;

import jakarta.validation.constraints.NotNull;

public record SampleStatusUpdateRequest(@NotNull Sample.Status status) {}
