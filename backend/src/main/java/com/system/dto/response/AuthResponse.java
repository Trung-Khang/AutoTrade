package com.system.dto.response;

public record AuthResponse(Long userId, String username, String fullName, String email, String phone, String role, String token, Long showroomId) { }
