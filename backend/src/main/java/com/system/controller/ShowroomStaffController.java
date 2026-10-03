package com.system.controller;

import com.system.dto.StaffAvailabilityDto;
import com.system.service.ShowroomStaffService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/showrooms")
public class ShowroomStaffController {
    private final ShowroomStaffService showroomStaffService;

    public ShowroomStaffController(ShowroomStaffService showroomStaffService) {
        this.showroomStaffService = showroomStaffService;
    }

    @GetMapping("/{showroomId}/staff")
    public ResponseEntity<List<StaffAvailabilityDto>> getStaff(
            @PathVariable Long showroomId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime appointmentDate) {
        return ResponseEntity.ok(showroomStaffService.getStaff(showroomId, appointmentDate));
    }
}
