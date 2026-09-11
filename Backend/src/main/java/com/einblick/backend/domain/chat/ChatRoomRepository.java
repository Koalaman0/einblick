package com.einblick.backend.domain.chat;

import com.einblick.backend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByUserAAndUserB(User userA, User userB);

    @Query("select r from ChatRoom r where r.userA = :user or r.userB = :user order by r.createdAt desc")
    List<ChatRoom> findAllByParticipant(@Param("user") User user);
}
