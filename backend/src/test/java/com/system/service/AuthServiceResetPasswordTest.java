package com.system.service;

import com.system.dto.request.ResetPasswordRequest;
import com.system.entity.AppUser;
import com.system.entity.PasswordResetSession;
import com.system.exception.AuthException;
import com.system.repository.AppUserRepository;
import com.system.repository.PasswordResetSessionRepository;
import com.system.security.JwtTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceResetPasswordTest {
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final PasswordResetSessionRepository sessions = mock(PasswordResetSessionRepository.class);
    private final AuthService service = new AuthService(mock(AppUserRepository.class), sessions, encoder,
            mock(OtpService.class), mock(JwtTokenService.class), 10);

    @Test
    void rejectsCurrentPasswordWithoutConsumingResetToken() {
        AppUser user = new AppUser();
        String oldHash = encoder.encode("OldPassword123");
        user.setPasswordHash(oldHash);
        PasswordResetSession session = sessionFor(user);

        AuthException error = assertThrows(AuthException.class, () -> service.resetPassword(
                new ResetPasswordRequest("valid-token", "OldPassword123", "OldPassword123")));

        assertEquals("Mật khẩu mới phải khác mật khẩu hiện tại.", error.getMessage());
        assertEquals(oldHash, user.getPasswordHash());
        assertNull(session.getConsumedAt());
    }

    @Test
    void acceptsDifferentPasswordAndConsumesResetToken() {
        AppUser user = new AppUser();
        user.setPasswordHash(encoder.encode("OldPassword123"));
        PasswordResetSession session = sessionFor(user);

        service.resetPassword(new ResetPasswordRequest("valid-token", "NewPassword123", "NewPassword123"));

        assertTrue(encoder.matches("NewPassword123", user.getPasswordHash()));
        assertFalse(encoder.matches("OldPassword123", user.getPasswordHash()));
        assertTrue(session.getConsumedAt() != null);
    }

    private PasswordResetSession sessionFor(AppUser user) {
        PasswordResetSession session = new PasswordResetSession();
        session.setUser(user);
        session.setExpiresAt(Instant.now().plusSeconds(600));
        when(sessions.findByTokenHashAndConsumedAtIsNull(anyString())).thenReturn(Optional.of(session));
        return session;
    }
}
