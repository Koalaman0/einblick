package com.einblick.backend.domain.po;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record PoCreateRequest(
    @NotBlank String poNumber,
    @NotNull Long programId,
    Long customerId,
    LocalDate dlvyDate,
    @NotNull PurchaseOrder.TransportMethod transportMethod,
    @NotEmpty @Valid List<PoLineCreateRequest> lines
) {}
