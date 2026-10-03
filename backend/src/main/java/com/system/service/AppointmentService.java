package com.system.service;

import com.system.dto.CheckInRequest;
import com.system.entity.Appointment;
import com.system.exception.ResourceNotFoundException;
import com.system.exception.AuthException;
import com.system.entity.Role;
import com.system.security.AppUserPrincipal;
import org.springframework.http.HttpStatus;
import com.system.repository.AppointmentRepository;
import com.system.repository.DepositRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DepositRepository depositRepository;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository, DepositRepository depositRepository) {
        this.appointmentRepository = appointmentRepository;
        this.depositRepository = depositRepository;
    }

    // Giữ constructor tương thích cho các test/consumer cũ không dùng dữ liệu deposit.
    public AppointmentService(AppointmentRepository appointmentRepository) {
        this(appointmentRepository, null);
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
        return checkIn(appointmentId, request, null);
    }

    @Transactional
    public Appointment checkIn(Long appointmentId, CheckInRequest request, AppUserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findLockedById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        if (currentUser != null && currentUser.role() == Role.STAFF
                && !currentUser.id().equals(appointment.getAssignedStaffId())) {
            throw new AuthException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền check-in lịch hẹn của nhân viên khác.");
        }

        if (!"PENDING".equalsIgnoreCase(appointment.getStatus())) {
            throw new AuthException(HttpStatus.CONFLICT, "Chỉ lịch hẹn PENDING mới được check-in.");
        }

        if (appointment.getDepositId() != null && depositRepository != null) {
            com.system.entity.Deposit deposit = depositRepository.findById(appointment.getDepositId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn cọc liên kết với lịch hẹn."));
            if (!"DEPOSITED".equalsIgnoreCase(deposit.getStatus())) {
                throw new AuthException(HttpStatus.CONFLICT,
                        "Đơn cọc chưa được thanh toán nên chưa thể tiếp nhận hoặc check-in lịch hẹn.");
            }
        }

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
