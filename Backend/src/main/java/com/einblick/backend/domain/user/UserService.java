package com.einblick.backend.domain.user;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponse> list() {
        return userRepository.findAll().stream()
            .map(UserResponse::from)
            .toList();
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + id));
        user.updateProfile(request.name(), request.role(), request.brandScope());
        return UserResponse.from(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + id));

        String currentLoginId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (user.getLoginId().equals(currentLoginId)) {
            throw new IllegalArgumentException("자기 자신은 삭제할 수 없습니다.");
        }

        userRepository.delete(user);
    }
}
