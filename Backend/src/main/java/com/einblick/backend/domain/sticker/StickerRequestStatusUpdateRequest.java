package com.einblick.backend.domain.sticker;

import jakarta.validation.constraints.NotNull;

public record StickerRequestStatusUpdateRequest(@NotNull StickerRequest.Status status) {}
