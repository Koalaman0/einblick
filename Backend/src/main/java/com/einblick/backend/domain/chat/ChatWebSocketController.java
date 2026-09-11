package com.einblick.backend.domain.chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

// STOMP로 들어오는 실시간 메시지 전송. REST(/api/chat/rooms/{id}/messages)는 이력 조회용이고,
// 실제 전송/실시간 브로드캐스트는 이 경로(/app/chat.send)로 이뤄진다.
@Controller
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(
        ChatService chatService,
        SimpMessagingTemplate messagingTemplate
    ) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void send(SendChatMessageRequest request, Principal principal) {
        ChatService.ChatMessageSendResult result =
            chatService.sendMessage(principal.getName(), request.roomId(), request.content());

        // 방 참여자 두 명(발신자 포함) 모두의 개인 큐로 보내서, 발신자의 다른 탭/기기에도 실시간 반영되게 한다.
        messagingTemplate.convertAndSendToUser(result.userALoginId(), "/queue/messages", result.message());
        messagingTemplate.convertAndSendToUser(result.userBLoginId(), "/queue/messages", result.message());
    }
}
