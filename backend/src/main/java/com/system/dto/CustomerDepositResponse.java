package com.system.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerDepositResponse(
        Long id,
        String depositCode,
        Long vehicleId,
        String vehicleTitle,
        BigDecimal vehiclePrice,
        BigDecimal depositAmount,
        String status,
        LocalDateTime appointmentDate,
        String appointmentStatus,
        boolean hasTestDrive,
        String note) { }
