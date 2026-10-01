package com.system.service;

import com.system.exception.AuthException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PasswordPolicyValidatorTest {
    private final PasswordPolicyValidator validator = new PasswordPolicyValidator();

    @Test
    void acceptsCompliantPassword() {
        assertDoesNotThrow(() -> validator.validate("ValidPass1!", "ValidPass1!", "driver", "driver@example.com"));
    }

    @Test
    void rejectsEachPolicyViolation() {
        assertPolicyMessage("Short1!", "ít nhất 8");
        assertPolicyMessage("lowercase1!", "chữ hoa");
        assertPolicyMessage("UPPERCASE1!", "chữ thường");
        assertPolicyMessage("NoDigitsHere!", "chữ số");
        assertPolicyMessage("NoSpecial123", "ký tự đặc biệt");
        assertPolicyMessage("ValidPass1!", "xác nhận", "Mismatch1!");
    }

    private void assertPolicyMessage(String password, String expectedMessage) {
        assertPolicyMessage(password, expectedMessage, password);
    }

    private void assertPolicyMessage(String password, String expectedMessage, String confirmation) {
        AuthException error = assertThrows(AuthException.class,
                () -> validator.validate(password, confirmation, "driver", "driver.mail@example.com"));
        assertEquals(true, error.getMessage().contains(expectedMessage));
    }
}
