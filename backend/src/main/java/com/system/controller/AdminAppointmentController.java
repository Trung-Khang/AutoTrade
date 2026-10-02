package com.system.controller;

import com.system.dto.AppointmentResponse;
import com.system.dto.RescheduleAppointmentRequest;
import com.system.service.AdminLedgerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/appointments")
public class AdminAppointmentController {
    private final AdminLedgerService ledgerService;

    public AdminAppointmentController(AdminLedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAppointments() {
        return ResponseEntity.ok(ledgerService.getAppointments());
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> reschedule(@PathVariable Long id,
                                                           @RequestBody RescheduleAppointmentRequest request) {
        return ResponseEntity.ok(ledgerService.reschedule(id, request));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable Long id,
                                                       @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ledgerService.cancelAppointment(id, reason));
    }
}
