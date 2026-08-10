package com.einblick.backend.domain.sticker;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record StickerRequestCreateRequest(
    @NotNull Long poId,
    @NotNull StickerRequest.Type stickerType,
    @NotNull @Positive Integer qty,
    BigDecimal lossRate
) {}
