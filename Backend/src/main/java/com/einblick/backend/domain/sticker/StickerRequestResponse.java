package com.einblick.backend.domain.sticker;

import java.math.BigDecimal;

public record StickerRequestResponse(
    Long id,
    String poNumber,
    String styleCode,
    String brand,
    String stickerType,
    Integer qty,
    BigDecimal lossRate,
    String status
) {
    public static StickerRequestResponse from(StickerRequest request) {
        var po = request.getPurchaseOrder();
        return new StickerRequestResponse(
            request.getId(),
            po.getPoNumber(),
            po.getProgram().getStyleCode(),
            po.getProgram().getBrand(),
            request.getStickerType().name(),
            request.getQty(),
            request.getLossRate(),
            request.getStatus().name()
        );
    }
}
