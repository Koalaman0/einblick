package com.einblick.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.jspecify.annotations.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

// CONNECT 프레임의 Authorization 네이티브 헤더에서 JWT를 꺼내 검증하고, 성공하면 STOMP 세션의
// Principal을 설정한다 - 이후 이 세션에서 보내는 메시지들은 이 Principal로 식별되고,
// convertAndSendToUser()도 이 이름(loginId)을 기준으로 수신자를 찾는다.
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public StompAuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        // wrap()은 메시지 헤더와 분리된 새 접근자를 만들어서 setUser()를 해도 반영되지 않는다.
        // 이 시점의 메시지는 이미 뮤터블 접근자를 갖고 있으므로 getAccessor()로 그걸 가져와야 한다.
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = firstHeader(accessor, "Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new MessagingException("인증 토큰이 없습니다.");
            }
            try {
                Claims claims = jwtService.parse(authHeader.substring(7));
                String loginId = claims.getSubject();
                String role = claims.get("role", String.class);
                accessor.setUser(new UsernamePasswordAuthenticationToken(
                    loginId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
                ));
            } catch (JwtException | IllegalArgumentException e) {
                throw new MessagingException("유효하지 않은 토큰입니다.");
            }
        }
        return message;
    }

    private String firstHeader(StompHeaderAccessor accessor, String name) {
        List<String> values = accessor.getNativeHeader(name);
        return values == null || values.isEmpty() ? null : values.get(0);
    }
}
