package com.system.dto.request;

public record ResetPasswordRequest(String resetToken, String newPassword, String confirmPassword) { }
