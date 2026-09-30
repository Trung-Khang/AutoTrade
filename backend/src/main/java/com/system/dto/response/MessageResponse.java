package com.system.dto.response;

public record MessageResponse(String message, boolean emailSent, Long retryAfterSeconds) { }
