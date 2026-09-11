package com.einblick.backend.config;

import com.einblick.backend.security.StompAuthChannelInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// 채팅 실시간 전송용 STOMP 엔드포인트. REST와 마찬가지로 JWT로 인증하는데, WebSocket 핸드셰이크는
// 브라우저가 커스텀 헤더를 못 붙이므로 STOMP CONNECT 프레임의 네이티브 헤더로 토큰을 받는다
// (StompAuthChannelInterceptor에서 검증). 이 핸드셰이크 자체는 인증 전에 열려야 하므로
// SecurityConfig에서 "/ws/**"를 permitAll 해둔다 - 실제 인증은 CONNECT 단계에서 이뤄진다.
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    public WebSocketConfig(StompAuthChannelInterceptor stompAuthChannelInterceptor) {
        this.stompAuthChannelInterceptor = stompAuthChannelInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns(allowedOrigins);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
