package com.einblick.backend.domain.sample;

import jakarta.validation.constraints.NotNull;

public record SampleTypeUpdateRequest(@NotNull Sample.Type type) {}
