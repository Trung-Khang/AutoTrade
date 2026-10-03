package com.system.dto;

public record StaffAvailabilityDto(
        Long id,
        String fullName,
        String phone,
        String email,
        boolean isAvailable,
        String statusText) {
}
