package com.einblick.backend.domain.shipping;

import java.time.LocalDate;

public record ShippingRuleResponse(
    Long id,
    String styleCode,
    String brand,
    String season,
    String poRangeFrom,
    String poRangeTo,
    String transportMethod,
    LocalDate exFactoryDate
) {
    public static ShippingRuleResponse from(ShippingRule rule) {
        return new ShippingRuleResponse(
            rule.getId(),
            rule.getProgram().getStyleCode(),
            rule.getProgram().getBrand(),
            rule.getSeason(),
            rule.getPoRangeFrom(),
            rule.getPoRangeTo(),
            rule.getTransportMethod().name(),
            rule.getExFactoryDate()
        );
    }
}
