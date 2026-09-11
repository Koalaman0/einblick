package com.einblick.backend.domain.chat;

import com.einblick.backend.domain.user.User;

// 채팅 상대를 고를 때 쓰는 최소 정보 - /api/users(관리자 전용)와 달리 전 직원이 조회 가능해야 해서 별도로 둔다.
public record ChatUserResponse(Long id, String name, String loginId) {
    public static ChatUserResponse from(User user) {
        return new ChatUserResponse(user.getId(), user.getName(), user.getLoginId());
    }
}
