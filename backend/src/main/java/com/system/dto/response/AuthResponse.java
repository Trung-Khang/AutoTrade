package com.system.dto.response;

public record AuthResponse(Long userId, String username, String fullName, String email, String role, String token) { }
