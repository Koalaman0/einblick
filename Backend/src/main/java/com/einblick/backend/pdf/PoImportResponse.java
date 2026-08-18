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
    List<LineDto> lines,
    List<UnparsedLineDto> unparsedLines
) {
    public record LineDto(String team, int totalQty, List<SizeDto> sizes) {}
    public record SizeDto(String sizeCode, int qty) {}
    // PDF에서 데이터 행 같아 보이는데 파싱 못 하고 넘어간 줄 - 페이지 번호를 같이 내려줘서
    // 사용자가 원본 PDF에서 확인하고 PO 상세에서 수동으로 라인을 추가할 수 있게 한다.
    public record UnparsedLineDto(int page, String text) {}

    public static PoImportResponse from(PurchaseOrder po, List<ProdLineParser.SkippedLine> skippedLines) {
        List<LineDto> lines = po.getPoLines().stream()
            .map(PoImportResponse::toLineDto)
            .toList();
        List<UnparsedLineDto> unparsedLines = skippedLines.stream()
            .map(s -> new UnparsedLineDto(s.page(), s.text()))
            .toList();

        return new PoImportResponse(
            po.getId(),
            po.getPoNumber(),
            po.getProgram().getStyleCode(),
            po.getProgram().getBrand(),
            po.getTransportMethod().name(),
            po.getDlvyDate(),
            po.getTotalQty(),
            lines,
            unparsedLines
        );
    }

    private static LineDto toLineDto(PoLine line) {
        List<SizeDto> sizes = line.getSizes().stream()
            .map(s -> new SizeDto(s.getSizeCode(), s.getQty()))
            .toList();
        return new LineDto(line.getTeam(), line.getTotalQty(), sizes);
    }
}
