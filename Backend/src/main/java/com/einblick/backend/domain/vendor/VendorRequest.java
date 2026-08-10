package com.einblick.backend.domain.vendor;

import jakarta.validation.constraints.NotBlank;

public record VendorRequest(
    @NotBlank String name,
    Boolean overseas,
    String contactName,
    String contactInfo
) {}
