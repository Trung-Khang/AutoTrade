package com.system.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public record CustomerDepositResponse(
        Long depositId,
        String depositCode,
        BigDecimal depositAmount,
        String status,
        String contractNumber,
        Long vehicleId,
        String vehicleTitle,
        BigDecimal vehiclePrice,
        Long showroomId,
        String showroomName,
        Long appointmentId,
        LocalDateTime appointmentDate,
        String appointmentStatus,
        boolean hasTestDrive,
        String customerNote,
        Instant createdAt) { }
