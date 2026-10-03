package com.system.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long appointmentId,
        Long depositId,
        String depositCode,
        String depositStatus,
        BigDecimal depositAmount,
        String customerName,
        String customerPhone,
        String vehicleInfo,
        Long vehicleId,
        LocalDateTime appointmentDate,
        boolean hasTestDrive,
        String status,
        String customerNote,
        String staffNote,
        Long showroomId,
        String showroomName,
        String showroomAddress,
        Long assignedStaffId,
        String assignedStaffName,
        String assignedStaffPhone) { }
