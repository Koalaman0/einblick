package com.einblick.backend.domain.po;

import java.time.LocalDate;

public record PurchaseOrderSummaryResponse(
    Long id,
    String poNumber,
    String styleCode,
    String brand,
    String customerName,
    String season,
    String status,
    LocalDate dlvyDate,
    String transportMethod,
    int totalQty
) {
    public static PurchaseOrderSummaryResponse from(PurchaseOrder po) {
        return new PurchaseOrderSummaryResponse(
            po.getId(),
            po.getPoNumber(),
            po.getProgram().getStyleCode(),
            po.getProgram().getBrand(),
            po.getCustomer().getName(),
            po.getProgram().getSeason(),
            po.getStatus().name(),
            po.getDlvyDate(),
            po.getTransportMethod().name(),
            po.getTotalQty()
        );
    }
}
