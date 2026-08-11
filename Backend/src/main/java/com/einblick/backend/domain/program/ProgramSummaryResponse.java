package com.einblick.backend.domain.program;

public record ProgramSummaryResponse(Long id, String brand, String league, String styleCode, String styleName, String season) {
    public static ProgramSummaryResponse from(Program program) {
        return new ProgramSummaryResponse(program.getId(), program.getBrand(), program.getLeague(), program.getStyleCode(), program.getStyleName(), program.getSeason());
    }
}
