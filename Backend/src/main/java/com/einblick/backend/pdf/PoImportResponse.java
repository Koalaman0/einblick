package com.einblick.backend.pdf;

import com.einblick.backend.domain.po.PoLine;
import com.einblick.backend.domain.po.PoLineSize;
import com.einblick.backend.domain.po.PurchaseOrder;

import java.time.LocalDate;
import java.util.List;

/**
 * PO 업로드 결과를 프론트에 내려줄 응답 DTO.
 * 엔티티를 그대로 반환하면 지연 로딩(Lazy) 관련 JSON 직렬화 문제가 생길 수 있어서 별도로 만듦.
 */
public record PoImportResponse(
    Long poId,
    String poNumber,
    String styleCode,
    String brand,
    String transportMethod,
    LocalDate dlvyDate,
    int totalQty,
    List<LineDto> lines
) {
    public record LineDto(String team, int totalQty, List<SizeDto> sizes) {}
    public record SizeDto(String sizeCode, int qty) {}

    public static PoImportResponse from(PurchaseOrder po) {
        List<LineDto> lines = po.getPoLines().stream()
            .map(PoImportResponse::toLineDto)
            .toList();

        return new PoImportResponse(
            po.getId(),
            po.getPoNumber(),
            po.getProgram().getStyleCode(),
            po.getProgram().getBrand(),
            po.getTransportMethod().name(),
            po.getDlvyDate(),
            po.getTotalQty(),
            lines
        );
    }

    private static LineDto toLineDto(PoLine line) {
        List<SizeDto> sizes = line.getSizes().stream()
            .map(s -> new SizeDto(s.getSizeCode(), s.getQty()))
            .toList();
        return new LineDto(line.getTeam(), line.getTotalQty(), sizes);
    }
}
