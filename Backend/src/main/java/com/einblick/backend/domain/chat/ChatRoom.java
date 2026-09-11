package com.einblick.backend.domain.chat;

import com.einblick.backend.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// 1:1 대화방. userA/userB는 항상 (작은 user_id, 큰 user_id) 순서로 저장해서
// (A,B)/(B,A) 중복 방을 만들지 않는다 - ChatService.getOrCreateRoom()에서 정렬해서 보장.
@Entity
@Table(name = "CHAT_ROOMS",
        uniqueConstraints = @UniqueConstraint(name = "UQ_CHAT_ROOM_PAIR", columnNames = {"USER_A_ID", "USER_B_ID"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CHAT_ROOM_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_A_ID", nullable = false)
    private User userA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_B_ID", nullable = false)
    private User userB;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public boolean hasParticipant(Long userId) {
        return userA.getId().equals(userId) || userB.getId().equals(userId);
    }

    public User otherParticipant(Long userId) {
        return userA.getId().equals(userId) ? userB : userA;
    }
}
