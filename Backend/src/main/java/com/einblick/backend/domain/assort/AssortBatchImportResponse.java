package com.einblick.backend.domain.assort;

import java.util.List;

public record AssortBatchImportResponse(
    int rowsRead,
    int created,
    int skippedRows,
    List<AssortResponse> items
) {
    public static AssortBatchImportResponse from(AssortExcelImportService.ImportResult result) {
        List<AssortResponse> items = result.created().stream().map(AssortResponse::from).toList();
        return new AssortBatchImportResponse(result.rowsRead(), items.size(), result.skippedRows(), items);
    }
}
