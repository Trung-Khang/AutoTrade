package com.system.service;

import com.system.dto.request.RegisterRequest;
import com.system.exception.AuthException;
import com.system.repository.AppUserRepository;
import com.system.repository.PasswordResetSessionRepository;
import com.system.security.JwtTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;

class AuthServicePasswordPolicyTest {
    @Test
    void rejectsWeakRegistrationPasswordBeforeAnyPersistenceOrOtp() {
        AppUserRepository users = mock(AppUserRepository.class);
        OtpService otpService = mock(OtpService.class);
        AuthService service = new AuthService(users, mock(PasswordResetSessionRepository.class),
                new BCryptPasswordEncoder(), otpService, mock(JwtTokenService.class),
                new PasswordPolicyValidator(), 10);

        AuthException error = assertThrows(AuthException.class, () -> service.register(
                new RegisterRequest("driver", "Demo Driver", "driver@example.com", "0900000000",
                        "weak", "weak")));

        assertEquals("Mật khẩu phải có ít nhất 8 ký tự.", error.getMessage());
        verifyNoInteractions(users, otpService);
    }

    @Test
    void rejectsRegistrationWhenConfirmationDoesNotMatch() {
        AppUserRepository users = mock(AppUserRepository.class);
        OtpService otpService = mock(OtpService.class);
        AuthService service = new AuthService(users, mock(PasswordResetSessionRepository.class),
                new BCryptPasswordEncoder(), otpService, mock(JwtTokenService.class),
                new PasswordPolicyValidator(), 10);

        AuthException error = assertThrows(AuthException.class, () -> service.register(
                new RegisterRequest("driver", "Demo Driver", "driver@example.com", "0900000000",
                        "ValidPass1!", "Different1!")));

        assertEquals("Mật khẩu xác nhận không khớp.", error.getMessage());
        verifyNoInteractions(users, otpService);
    }

    @Test
    void rejectsInvalidVietnamesePhoneBeforePersistence() {
        AppUserRepository users = mock(AppUserRepository.class);
        OtpService otpService = mock(OtpService.class);
        AuthService service = new AuthService(users, mock(PasswordResetSessionRepository.class),
                new BCryptPasswordEncoder(), otpService, mock(JwtTokenService.class),
                new PasswordPolicyValidator(), 10);

        AuthException error = assertThrows(AuthException.class, () -> service.register(
                new RegisterRequest("driver", "Demo Driver", "driver@example.com", "0123456789",
                        "ValidPass1!", "ValidPass1!")));

        assertEquals("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.", error.getMessage());
        verifyNoInteractions(users, otpService);
    }

    @Test
    void rejectsDuplicateNormalizedPhone() {
        AppUserRepository users = mock(AppUserRepository.class);
        OtpService otpService = mock(OtpService.class);
        when(users.findByEmailIgnoreCase("driver@example.com")).thenReturn(Optional.empty());
        when(users.existsByUsernameIgnoreCase("driver")).thenReturn(false);
        when(users.existsByPhone("0900000000")).thenReturn(true);
        AuthService service = new AuthService(users, mock(PasswordResetSessionRepository.class),
                new BCryptPasswordEncoder(), otpService, mock(JwtTokenService.class),
                new PasswordPolicyValidator(), 10);

        AuthException error = assertThrows(AuthException.class, () -> service.register(
                new RegisterRequest("driver", "Demo Driver", "driver@example.com", "+84 900 000 000",
                        "ValidPass1!", "ValidPass1!")));

        assertEquals("Số điện thoại đã được sử dụng.", error.getMessage());
    }
}
