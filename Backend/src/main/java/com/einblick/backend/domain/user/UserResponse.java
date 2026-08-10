package com.einblick.backend.domain.user;

import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String name,
    String loginId,
    String role,
    String brandScope,
    LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getLoginId(),
            user.getRole().name(),
            user.getBrandScope(),
            user.getCreatedAt()
        );
    }
}
