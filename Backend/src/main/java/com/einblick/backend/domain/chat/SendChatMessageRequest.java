package com.einblick.backend.domain.chat;

public record SendChatMessageRequest(Long roomId, String content) {}
