package com.system.service;

import com.system.exception.AuthException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicyValidator {
    private static final int MIN_LENGTH = 8;
    private static final String SPECIAL_CHARACTERS = "@#$%^&+=!";

    public void validate(String password, String confirmPassword, String username, String email) {
        if (password == null || password.length() < MIN_LENGTH) {
            reject("Mật khẩu phải có ít nhất 8 ký tự.");
        }
        if (!password.chars().anyMatch(Character::isUpperCase)) {
            reject("Mật khẩu phải có ít nhất 1 chữ hoa.");
        }
        if (!password.chars().anyMatch(Character::isLowerCase)) {
            reject("Mật khẩu phải có ít nhất 1 chữ thường.");
        }
        if (!password.chars().anyMatch(Character::isDigit)) {
            reject("Mật khẩu phải có ít nhất 1 chữ số.");
        }
        if (password.chars().noneMatch(character -> SPECIAL_CHARACTERS.indexOf(character) >= 0)) {
            reject("Mật khẩu phải có ít nhất 1 ký tự đặc biệt (@#$%^&+=!).");
        }
        if (!password.equals(confirmPassword)) {
            reject("Mật khẩu xác nhận không khớp.");
        }
    }

    private void reject(String message) {
        throw new AuthException(HttpStatus.BAD_REQUEST, message);
    }
}
