package com.einblick.backend.domain.materialorder;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MaterialOrderCreateRequest(
    @NotNull Long programId,
    @NotNull Long vendorId,
    String item,
    Integer qty,
    BigDecimal amount,
    MaterialOrder.TransportMethod transportMethod
) {}
