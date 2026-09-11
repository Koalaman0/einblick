package com.einblick.backend.domain.chat;

import jakarta.validation.constraints.NotNull;

public record StartChatRequest(@NotNull Long otherUserId) {}
