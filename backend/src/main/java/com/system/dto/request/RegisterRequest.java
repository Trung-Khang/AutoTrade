package com.system.dto.request;

public record RegisterRequest(String username, String fullName, String email, String phone,
                              String password, String confirmPassword) { }
