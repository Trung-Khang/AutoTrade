package com.system.service;

import com.system.dto.CheckInRequest;
import com.system.entity.Appointment;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.AppointmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * Lấy danh sách lịch hẹn của showroom (Staff tra cứu trong ngày)
     */
    @Transactional(readOnly = true)
    public List<Appointment> getAppointments(Long showroomId, String status) {
        if (showroomId != null) {
            return appointmentRepository.findByShowroomIdOrderByAppointmentDateAsc(showroomId);
        }
        if (status != null && !status.trim().isEmpty()) {
            return appointmentRepository.findByStatus(status);
        }
        return appointmentRepository.findAll();
    }

    /**
     * Nhân viên showroom xác nhận khách đã đến / đã lái thử (FR-12, UC-14)
     */
    @Transactional
    public Appointment checkIn(Long appointmentId, CheckInRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        appointment.setStatus("COMPLETED");
        if (request.isTestDriveCompleted()) {
            appointment.setHasTestDrive(true);
        }
        if (request.getStaffNote() != null) {
            appointment.setStaffNote(request.getStaffNote());
        }
        appointment.setUpdatedAt(Instant.now());

        return appointmentRepository.save(appointment);
    }

    /**
     * Lấy danh sách lịch hẹn của khách hàng cá nhân
     */
    @Transactional(readOnly = true)
    public List<Appointment> getMyAppointments(Long userId) {
        return appointmentRepository.findByUserIdOrderByAppointmentDateDesc(userId);
    }
}
