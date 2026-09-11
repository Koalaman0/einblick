package com.einblick.backend.domain.chat;

import java.time.LocalDateTime;

public record ChatRoomResponse(
    Long roomId,
    Long otherUserId,
    String otherUserName,
    String lastMessage,
    LocalDateTime lastMessageAt
) {}
