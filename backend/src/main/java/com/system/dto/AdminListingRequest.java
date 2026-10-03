package com.system.dto;

import java.math.BigDecimal;

public record AdminListingRequest(
        String brand,
        String model,
        String variant,
        Integer manufactureYear,
        String fuelType,
        String transmission,
        Double engineSize,
        Integer seatCount,
        String origin,
        String bodyType,
        BigDecimal price,
        Integer mileage,
        String color,
        String location,
        String imageUrl,
        String status,
        Long showroomId
) {
}
