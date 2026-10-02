package com.system.dto;

import java.time.LocalDateTime;

public record RescheduleAppointmentRequest(LocalDateTime appointmentDate, String reason) { }
