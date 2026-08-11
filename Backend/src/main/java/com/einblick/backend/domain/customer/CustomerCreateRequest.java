package com.einblick.backend.domain.customer;

import jakarta.validation.constraints.NotBlank;

public record CustomerCreateRequest(@NotBlank String code, @NotBlank String name, Boolean houseAlias) {}
