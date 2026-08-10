package com.einblick.backend.domain.assort;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AssortCreateRequest(
    @NotNull Long programId,
    String team,
    String player,
    // 공란/빈 문자열도 유효한 입력이다 - 서비스단에서 HOUSE 자동 매칭으로 취급한다
    String customerLabel,
    String sourceFile,
    @NotEmpty List<SizeItem> sizes
) {
    public record SizeItem(@NotBlank String sizeCode, @NotNull Integer qty) {}
}
