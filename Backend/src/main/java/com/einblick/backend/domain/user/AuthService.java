package com.einblick.backend.domain.user;

import com.einblick.backend.security.JwtService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

        // 계정이 하나도 없을 때(최초 부트스트랩)만 회원가입을 열어두고, 그 최초 계정을 ADMIN으로 만든다.
        // 그 이후로는 ADMIN으로 로그인한 상태에서만 새 계정을 만들 수 있다.
        boolean isFirstUser = userRepository.count() == 0;
        if (!isFirstUser && !currentUserIsAdmin()) {
            throw new IllegalArgumentException("이미 계정이 존재합니다. 관리자만 새 계정을 생성할 수 있습니다.");
        }

        User.Role role = isFirstUser
            ? User.Role.ADMIN
            : (request.role() != null ? request.role() : User.Role.STAFF);

        User user = User.builder()
            .name(request.name())
            .loginId(request.loginId())
            .password(passwordEncoder.encode(request.password()))
            .brandScope(request.brandScope())
            .role(role)
            .build();

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getId(), saved.getLoginId(), saved.getRole().name());
        return AuthResponse.of(token, saved);
    }

    private boolean currentUserIsAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated()
            && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
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
