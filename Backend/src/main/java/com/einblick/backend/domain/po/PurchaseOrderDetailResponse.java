package com.einblick.backend.domain.po;

import java.time.LocalDate;
import java.util.List;

public record PurchaseOrderDetailResponse(
    Long id,
    String poNumber,
    String styleCode,
    String brand,
    String customerName,
    String season,
    String status,
    LocalDate dlvyDate,
    String transportMethod,
    int totalQty,
    List<LineDto> lines
) {
    public record LineDto(Long id, String team, String player, int totalQty, List<SizeDto> sizes) {}
    public record SizeDto(String sizeCode, int qty) {}

    public static PurchaseOrderDetailResponse from(PurchaseOrder po) {
        List<LineDto> lines = po.getPoLines().stream()
            .map(PurchaseOrderDetailResponse::toLineDto)
            .toList();

        return new PurchaseOrderDetailResponse(
            po.getId(),
            po.getPoNumber(),
            po.getProgram().getStyleCode(),
            po.getProgram().getBrand(),
            po.getCustomer().getName(),
            po.getProgram().getSeason(),
            po.getStatus().name(),
            po.getDlvyDate(),
            po.getTransportMethod().name(),
            po.getTotalQty(),
            lines
        );
    }

    private static LineDto toLineDto(PoLine line) {
        List<SizeDto> sizes = line.getSizes().stream()
            .map(s -> new SizeDto(s.getSizeCode(), s.getQty()))
            .toList();
        return new LineDto(line.getId(), line.getTeam(), line.getPlayer(), line.getTotalQty(), sizes);
    }
}
