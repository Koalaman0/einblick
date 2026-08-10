package com.einblick.backend.domain.shipping;

import com.einblick.backend.domain.po.PurchaseOrder;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ShippingRegisterRequest(
    @NotNull LocalDate dlvyDate,
    @NotNull PurchaseOrder.TransportMethod transportMethod
) {}
