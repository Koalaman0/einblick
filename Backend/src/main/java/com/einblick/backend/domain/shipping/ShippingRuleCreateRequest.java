package com.einblick.backend.domain.shipping;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ShippingRuleCreateRequest(
    @NotNull Long programId,
    String season,
    String poRangeFrom,
    String poRangeTo,
    @NotNull ShippingRule.RequiredTransportMethod transportMethod,
    LocalDate exFactoryDate
) {}
