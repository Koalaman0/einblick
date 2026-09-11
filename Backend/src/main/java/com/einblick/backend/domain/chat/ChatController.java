package com.einblick.backend.domain.chat;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/users")
    public List<ChatUserResponse> listContacts(Authentication auth) {
        return chatService.listChatContacts(auth.getName());
    }

    @GetMapping("/rooms")
    public List<ChatRoomResponse> listRooms(Authentication auth) {
        return chatService.listRooms(auth.getName());
    }

    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomResponse> startRoom(Authentication auth, @Valid @RequestBody StartChatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.getOrCreateRoom(auth.getName(), request.otherUserId()));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public List<ChatMessageResponse> listMessages(Authentication auth, @PathVariable Long roomId) {
        return chatService.listMessages(auth.getName(), roomId);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
