package com.einblick.backend.domain.reconciliation;

public record ReconciliationResultResponse(
    Long id,
    String styleCode,
    String brand,
    String team,
    String player,
    String poNumber,
    Integer poQty,
    String customerLabel,
    Integer assortQty,
    int diffQty,
    String status,
    boolean houseMatched,
    String note
) {
    public static ReconciliationResultResponse from(ReconciliationResult r) {
        var poLine = r.getPoLine();
        var assort = r.getAssort();

        String styleCode = poLine != null
            ? poLine.getPurchaseOrder().getProgram().getStyleCode()
            : assort.getProgram().getStyleCode();
        String brand = poLine != null
            ? poLine.getPurchaseOrder().getProgram().getBrand()
            : assort.getProgram().getBrand();
        String team = poLine != null ? poLine.getTeam() : assort.getTeam();
        String player = poLine != null ? poLine.getPlayer() : assort.getPlayer();

        return new ReconciliationResultResponse(
            r.getId(),
            styleCode,
            brand,
            team,
            player,
            poLine != null ? poLine.getPurchaseOrder().getPoNumber() : null,
            poLine != null ? poLine.getTotalQty() : null,
            assort != null ? assort.getCustomerLabel() : null,
            assort != null ? assort.getTotalQty() : null,
            r.getDiffQty(),
            r.getStatus().name(),
            r.getHouseMatched(),
            r.getNote()
        );
    }
}
