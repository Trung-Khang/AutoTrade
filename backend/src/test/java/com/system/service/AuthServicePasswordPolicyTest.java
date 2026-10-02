package com.system.service;

import com.system.dto.request.RegisterRequest;
import com.system.dto.request.UpdateProfileRequest;
import com.system.entity.AppUser;
import com.system.entity.Role;
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
import static org.mockito.Mockito.verify;

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

    @Test
    void updatesCurrentUserNameAndNormalizesPhone() {
        AppUserRepository users = mock(AppUserRepository.class);
        AppUser user = mock(AppUser.class);
        when(users.findLockedById(7L)).thenReturn(Optional.of(user));
        when(user.getPhone()).thenReturn("0900000000");
        when(user.getId()).thenReturn(7L);
        when(user.getUsername()).thenReturn("customer");
        when(user.getFullName()).thenReturn("Nguyen Van B");
        when(user.getEmail()).thenReturn("customer@example.com");
        when(user.getRole()).thenReturn(Role.CUSTOMER);
        AuthService service = new AuthService(users, mock(PasswordResetSessionRepository.class),
                new BCryptPasswordEncoder(), mock(OtpService.class), mock(JwtTokenService.class),
                new PasswordPolicyValidator(), 10);

        var response = service.updateCurrentUser(
                new UpdateProfileRequest("  Nguyen Van A  ", "+84 912 345 678"), 7L);

        verify(user).setFullName("Nguyen Van A");
        verify(user).setPhone("0912345678");
        verify(users).saveAndFlush(user);
        assertEquals("0900000000", response.phone());
        assertEquals("Nguyen Van B", response.fullName());
    }

    @Test
    void rejectsDuplicatePhoneWhenUpdatingCurrentUser() {
        AppUserRepository users = mock(AppUserRepository.class);
        AppUser user = mock(AppUser.class);
        when(users.findLockedById(7L)).thenReturn(Optional.of(user));
        when(user.getPhone()).thenReturn("0900000000");
        when(users.existsByPhone("0912345678")).thenReturn(true);
        AuthService service = new AuthService(users, mock(PasswordResetSessionRepository.class),
                new BCryptPasswordEncoder(), mock(OtpService.class), mock(JwtTokenService.class),
                new PasswordPolicyValidator(), 10);

        AuthException error = assertThrows(AuthException.class, () -> service.updateCurrentUser(
                new UpdateProfileRequest("Nguyen Van A", "0912345678"), 7L));

        assertEquals("Số điện thoại đã được sử dụng.", error.getMessage());
        verifyNoInteractionsAfterLookup(user);
    }

    @Test
    void rejectsInvalidPhoneBeforeLoadingCurrentUser() {
        AppUserRepository users = mock(AppUserRepository.class);
        AuthService service = new AuthService(users, mock(PasswordResetSessionRepository.class),
                new BCryptPasswordEncoder(), mock(OtpService.class), mock(JwtTokenService.class),
                new PasswordPolicyValidator(), 10);

        AuthException error = assertThrows(AuthException.class, () -> service.updateCurrentUser(
                new UpdateProfileRequest("Nguyen Van A", "0123456789"), 7L));

        assertEquals("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.", error.getMessage());
        verifyNoInteractions(users);
    }

    private void verifyNoInteractionsAfterLookup(AppUser user) {
        verify(user, org.mockito.Mockito.never()).setFullName(org.mockito.ArgumentMatchers.anyString());
        verify(user, org.mockito.Mockito.never()).setPhone(org.mockito.ArgumentMatchers.anyString());
    }
}
