package com.einblick.backend.domain.user;

import com.einblick.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByLoginId(request.loginId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다: " + request.loginId());
        }

        User user = User.builder()
            .name(request.name())
            .loginId(request.loginId())
            .password(passwordEncoder.encode(request.password()))
            .brandScope(request.brandScope())
            .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getId(), saved.getLoginId(), saved.getRole().name());
        return AuthResponse.of(token, saved);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByLoginId(request.loginId())
            .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtService.generateToken(user.getId(), user.getLoginId(), user.getRole().name());
        return AuthResponse.of(token, user);
    }
}
