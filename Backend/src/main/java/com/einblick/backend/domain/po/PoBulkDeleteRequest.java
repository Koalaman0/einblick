package com.einblick.backend.domain.po;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PoBulkDeleteRequest(@NotEmpty List<Long> ids) {}
