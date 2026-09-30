package com.system.security;

import com.system.exception.AuthException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {
    private SecurityUtils() { }

    public static AppUserPrincipal currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập hợp lệ để sử dụng chức năng này.");
        }
        return principal;
    }
}
