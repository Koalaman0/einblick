package com.einblick.backend.domain.shipping;

import com.einblick.backend.domain.po.PurchaseOrder;

import java.time.LocalDate;

public record ShippingResponse(
    Long id,
    String poNumber,
    String styleCode,
    String brand,
    LocalDate dlvyDate,
    String transportMethod,
    String status,
    int totalQty,
    boolean violatesRule
) {
    public static ShippingResponse from(PurchaseOrder po, boolean violatesRule) {
        return new ShippingResponse(
            po.getId(),
            po.getPoNumber(),
            po.getProgram().getStyleCode(),
            po.getProgram().getBrand(),
            po.getDlvyDate(),
            po.getTransportMethod().name(),
            po.getStatus().name(),
            po.getTotalQty(),
            violatesRule
        );
    }
}
