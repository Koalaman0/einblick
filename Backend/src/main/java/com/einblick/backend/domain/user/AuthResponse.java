package com.einblick.backend.domain.user;

public record AuthResponse(String token, Long userId, String name, String loginId, String role) {
    public static AuthResponse of(String token, User user) {
        return new AuthResponse(token, user.getId(), user.getName(), user.getLoginId(), user.getRole().name());
    }
}
