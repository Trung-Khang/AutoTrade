package com.system.security;

import com.system.service.OtpService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthSecurityUnitTest {
    @Test
    void passwordIsStoredAsBcryptAndMatchesOnlyTheOriginalValue() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String hash = encoder.encode("correct-password");

        assertNotEquals("correct-password", hash);
        assertTrue(encoder.matches("correct-password", hash));
        assertFalse(encoder.matches("wrong-password", hash));
    }

    @Test
    void otpHashDoesNotExposeTheSixDigitCode() {
        String code = "123456";
        String hash = OtpService.sha256(code);

        assertNotEquals(code, hash);
        assertTrue(hash.matches("[0-9a-f]{64}"));
        assertNotEquals(hash, OtpService.sha256("654321"));
    }
}
