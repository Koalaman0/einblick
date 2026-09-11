package com.einblick.backend.domain.chat;

import java.time.LocalDateTime;

public record ChatMessageResponse(
    Long id,
    Long roomId,
    Long senderId,
    String senderName,
    String content,
    LocalDateTime createdAt
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
            message.getId(),
            message.getRoom().getId(),
            message.getSender().getId(),
            message.getSender().getName(),
            message.getContent(),
            message.getCreatedAt()
        );
    }
}
