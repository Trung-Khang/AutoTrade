package com.system.controller;

import com.system.dto.CheckInRequest;
import com.system.entity.Appointment;
import com.system.service.AppointmentService;
import com.system.service.AdminLedgerService;
import com.system.dto.AppointmentResponse;
import com.system.entity.Role;
import com.system.security.AppUserPrincipal;
import com.system.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff/appointments")
@Tag(name = "3. Staff Appointment API", description = "Các API cho Nhân viên showroom tra cứu lịch hẹn và xác nhận khách đến xem xe/lái thử")
public class StaffAppointmentController {

    private final AppointmentService appointmentService;
    private final AdminLedgerService ledgerService;

    public StaffAppointmentController(AppointmentService appointmentService, AdminLedgerService ledgerService) {
        this.appointmentService = appointmentService;
        this.ledgerService = ledgerService;
    }

    // 1. Nhân viên showroom tra cứu lịch hẹn xem xe
    @GetMapping
    @Operation(summary = "Lấy danh sách lịch hẹn tại Showroom", 
               description = "Nhân viên showroom xem danh sách khách hẹn đến xem xe trong ngày, lọc theo showroom và trạng thái.")
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @RequestParam(required = false) Long showroomId,
            @RequestParam(required = false) String status) {
        AppUserPrincipal currentUser = SecurityUtils.currentUser();
        List<AppointmentResponse> list = ledgerService.getAppointments().stream()
                .filter(item -> currentUser.role() == Role.ADMIN
                        || (item.assignedStaffId() != null && item.assignedStaffId().equals(currentUser.id())))
                .filter(item -> showroomId == null || showroomId.equals(item.showroomId()))
                .filter(item -> status == null || status.isBlank() || status.equalsIgnoreCase(item.status()))
                .toList();
        return ResponseEntity.ok(list);
    }

    // 2. Nhân viên xác nhận khách đã đến showroom / đã lái thử (Check-in)
    @PutMapping("/{id}/check-in")
    @Operation(summary = "Xác nhận khách đã đến showroom / đã lái thử xe", 
               description = "Nhân viên showroom bấm nút Check-in khi khách đến, cập nhật ghi chú và kết quả lái thử.")
    public ResponseEntity<Appointment> checkIn(
            @PathVariable Long id,
            @RequestBody CheckInRequest request) {
        Appointment updated = appointmentService.checkIn(id, request, SecurityUtils.currentUser());
        return ResponseEntity.ok(updated);
    }
}
