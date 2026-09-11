package com.einblick.backend.domain.chat;

import com.einblick.backend.domain.user.User;
import com.einblick.backend.domain.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ChatService(
        UserRepository userRepository,
        ChatRoomRepository chatRoomRepository,
        ChatMessageRepository chatMessageRepository
    ) {
        this.userRepository = userRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    public List<ChatUserResponse> listChatContacts(String myLoginId) {
        User me = requireUser(myLoginId);
        return userRepository.findAll().stream()
            .filter(u -> !u.getId().equals(me.getId()))
            .map(ChatUserResponse::from)
            .toList();
    }

    public List<ChatRoomResponse> listRooms(String myLoginId) {
        User me = requireUser(myLoginId);
        List<ChatRoom> rooms = chatRoomRepository.findAllByParticipant(me);
        List<ChatRoomResponse> result = new ArrayList<>();
        for (ChatRoom room : rooms) {
            User other = room.otherParticipant(me.getId());
            var lastMessage = chatMessageRepository.findTopByRoomOrderByCreatedAtDesc(room).orElse(null);
            result.add(new ChatRoomResponse(
                room.getId(),
                other.getId(),
                other.getName(),
                lastMessage != null ? lastMessage.getContent() : null,
                lastMessage != null ? lastMessage.getCreatedAt() : room.getCreatedAt()
            ));
        }
        result.sort((a, b) -> b.lastMessageAt().compareTo(a.lastMessageAt()));
        return result;
    }

    // 이미 방이 있으면 그 방을, 없으면 새로 만들어서 반환한다 (같은 두 사람은 방이 하나만 존재).
    @Transactional
    public ChatRoomResponse getOrCreateRoom(String myLoginId, Long otherUserId) {
        User me = requireUser(myLoginId);
        if (me.getId().equals(otherUserId)) {
            throw new IllegalArgumentException("자기 자신과는 대화방을 만들 수 없습니다.");
        }
        User other = userRepository.findById(otherUserId)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + otherUserId));

        User first = me.getId() < other.getId() ? me : other;
        User second = me.getId() < other.getId() ? other : me;

        ChatRoom room = chatRoomRepository.findByUserAAndUserB(first, second)
            .orElseGet(() -> chatRoomRepository.save(ChatRoom.builder().userA(first).userB(second).build()));

        return new ChatRoomResponse(room.getId(), other.getId(), other.getName(), null, room.getCreatedAt());
    }

    public List<ChatMessageResponse> listMessages(String myLoginId, Long roomId) {
        User me = requireUser(myLoginId);
        ChatRoom room = requireRoomWithAccess(roomId, me.getId());
        return chatMessageRepository.findByRoomOrderByCreatedAtAsc(room).stream()
            .map(ChatMessageResponse::from)
            .toList();
    }

    // userA/userB는 LAZY라서, 트랜잭션(영속성 컨텍스트)이 끝난 뒤 컨트롤러에서 접근하면
    // LazyInitializationException이 난다. 필요한 로그인 아이디를 트랜잭션 안에서 미리 꺼내 함께 반환한다.
    @Transactional
    public ChatMessageSendResult sendMessage(String myLoginId, Long roomId, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메시지 내용이 비어 있습니다.");
        }
        User me = requireUser(myLoginId);
        ChatRoom room = requireRoomWithAccess(roomId, me.getId());

        ChatMessage message = ChatMessage.builder()
            .room(room)
            .sender(me)
            .content(content.trim())
            .build();
        ChatMessageResponse response = ChatMessageResponse.from(chatMessageRepository.save(message));
        return new ChatMessageSendResult(response, room.getUserA().getLoginId(), room.getUserB().getLoginId());
    }

    public record ChatMessageSendResult(ChatMessageResponse message, String userALoginId, String userBLoginId) {}

    private ChatRoom requireRoomWithAccess(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("대화방을 찾을 수 없습니다: " + roomId));
        if (!room.hasParticipant(userId)) {
            throw new AccessDeniedException("이 대화방에 접근할 권한이 없습니다.");
        }
        return room;
    }

    private User requireUser(String loginId) {
        return userRepository.findByLoginId(loginId)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + loginId));
    }
}
