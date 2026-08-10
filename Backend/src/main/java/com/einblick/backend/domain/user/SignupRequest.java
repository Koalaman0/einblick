package com.einblick.backend.domain.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank String name,
    @NotBlank String loginId,
    @NotBlank @Size(min = 4, max = 100) String password,
    String brandScope
) {}
