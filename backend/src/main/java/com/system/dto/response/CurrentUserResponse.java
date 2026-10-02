package com.system.dto.response;

public record CurrentUserResponse(Long id, String username, String fullName, String email, String phone, String role) { }
