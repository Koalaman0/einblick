package com.einblick.backend.domain.assort;

import java.util.List;

public record AssortResponse(
    Long id,
    Long programId,
    String team,
    String player,
    String customerLabel,
    String assortSolid,
    String ratio,
    String polybag,
    String carton,
    String hanger,
    int totalQty,
    List<SizeDto> sizes
) {
    public record SizeDto(String sizeCode, int qty) {}

    public static AssortResponse from(Assort assort) {
        List<SizeDto> sizes = assort.getSizes().stream()
            .map(s -> new SizeDto(s.getSizeCode(), s.getQty()))
            .toList();
        return new AssortResponse(
            assort.getId(),
            assort.getProgram().getId(),
            assort.getTeam(),
            assort.getPlayer(),
            assort.getCustomerLabel(),
            assort.getAssortSolid(),
            assort.getRatio(),
            assort.getPolybag(),
            assort.getCarton(),
            assort.getHanger(),
            assort.getTotalQty(),
            sizes
        );
    }
}
