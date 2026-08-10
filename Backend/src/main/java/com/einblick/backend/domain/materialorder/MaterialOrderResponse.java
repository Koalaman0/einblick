package com.einblick.backend.domain.materialorder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MaterialOrderResponse(
    Long id,
    String styleCode,
    String brand,
    String vendorName,
    String item,
    Integer qty,
    BigDecimal amount,
    String approvalStatus,
    String wireStatus,
    String transportMethod,
    LocalDateTime createdAt
) {
    public static MaterialOrderResponse from(MaterialOrder order) {
        return new MaterialOrderResponse(
            order.getId(),
            order.getProgram().getStyleCode(),
            order.getProgram().getBrand(),
            order.getVendor().getName(),
            order.getItem(),
            order.getQty(),
            order.getAmount(),
            order.getApprovalStatus().name(),
            order.getWireStatus().name(),
            order.getTransportMethod() != null ? order.getTransportMethod().name() : null,
            order.getCreatedAt()
        );
    }
}
