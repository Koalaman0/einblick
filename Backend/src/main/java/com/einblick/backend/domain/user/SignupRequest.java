package com.einblick.backend.domain.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank String name,
    @NotBlank String loginId,
    @NotBlank @Size(min = 4, max = 100) String password,
    String brandScope,
    // ADMIN이 다른 계정을 생성할 때만 의미 있음 - 최초 부트스트랩 계정은 항상 ADMIN, 그 외 본인 가입은 항상 STAFF
    User.Role role
) {}
