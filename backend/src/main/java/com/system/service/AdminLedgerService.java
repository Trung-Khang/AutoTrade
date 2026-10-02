package com.system.service;

import com.system.dto.AppointmentResponse;
import com.system.dto.RescheduleAppointmentRequest;
import com.system.entity.AppUser;
import com.system.entity.Appointment;
import com.system.entity.Deposit;
import com.system.entity.TransactionLedger;
import com.system.entity.Vehicle;
import com.system.exception.AuthException;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.AppUserRepository;
import com.system.repository.AppointmentRepository;
import com.system.repository.DepositRepository;
import com.system.repository.TransactionLedgerRepository;
import com.system.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class AdminLedgerService {
    private final TransactionLedgerRepository ledgerRepository;
    private final DepositRepository depositRepository;
    private final VehicleRepository vehicleRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppUserRepository appUserRepository;

    public AdminLedgerService(TransactionLedgerRepository ledgerRepository, DepositRepository depositRepository,
                              VehicleRepository vehicleRepository, AppointmentRepository appointmentRepository,
                              AppUserRepository appUserRepository) {
        this.ledgerRepository = ledgerRepository;
        this.depositRepository = depositRepository;
        this.vehicleRepository = vehicleRepository;
        this.appointmentRepository = appointmentRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLedgerOverview() {
        List<TransactionLedger> transactions = ledgerRepository.findAllByOrderByCreatedAtDesc();
        BigDecimal totalHolding = ledgerRepository.getTotalHoldingDepositAmount();
        Map<String, Object> response = new HashMap<>();
        response.put("totalTransactions", transactions.size());
        response.put("totalHoldingAmount", totalHolding != null ? totalHolding : BigDecimal.ZERO);
        response.put("transactions", transactions);
        return response;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointments() {
        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public AppointmentResponse reschedule(Long appointmentId, RescheduleAppointmentRequest request) {
        if (request == null || request.appointmentDate() == null || !request.appointmentDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ngày giờ mới phải hợp lệ và nằm trong tương lai.");
        }
        Appointment appointment = appointmentRepository.findLockedById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
        requirePending(appointment);
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setUpdatedAt(Instant.now());
        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public Map<String, Object> cancelAppointment(Long appointmentId, String reason) {
        Appointment reference = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
        if (reference.getDepositId() == null) {
            throw new AuthException(HttpStatus.CONFLICT, "Lịch hẹn không liên kết đơn cọc, không thể hoàn tiền.");
        }
        Deposit deposit = depositRepository.findLockedById(reference.getDepositId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn cọc liên kết."));
        Appointment appointment = appointmentRepository.findLockedById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
        requirePending(appointment);
        return refundLockedDeposit(deposit, appointment, reason);
    }

    @Transactional
    public Map<String, Object> refundDeposit(Long depositId, String refundReason) {
        Deposit deposit = depositRepository.findLockedById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn cọc với ID: " + depositId));
        Appointment appointment = appointmentRepository.findLockedByDepositId(depositId).orElse(null);
        return refundLockedDeposit(deposit, appointment, refundReason);
    }

    private Map<String, Object> refundLockedDeposit(Deposit deposit, Appointment appointment, String reason) {
        if (!"DEPOSITED".equalsIgnoreCase(deposit.getStatus())) {
            throw new AuthException(HttpStatus.CONFLICT, "Chỉ đơn cọc DEPOSITED mới được hoàn tiền.");
        }
        if (appointment != null) {
            requirePending(appointment);
            appointment.setStatus("CANCELLED");
            appointment.setUpdatedAt(Instant.now());
            appointmentRepository.save(appointment);
        }
        deposit.setStatus("REFUNDED");
        depositRepository.save(deposit);
        if (vehicleRepository.releaseVehicleHold(deposit.getVehicleId()) != 1) {
            throw new AuthException(HttpStatus.CONFLICT, "Không thể mở lại trạng thái xe.");
        }
        String note = reason == null || reason.isBlank() ? "Theo yêu cầu Admin" : reason.trim();
        ledgerRepository.save(new TransactionLedger(deposit.getId(), deposit.getAmount().negate(), "REFUND",
                "Hoàn trả tiền cọc: " + note));

        Map<String, Object> result = new HashMap<>();
        result.put("depositId", deposit.getId());
        result.put("appointmentId", appointment == null ? null : appointment.getId());
        result.put("status", "REFUNDED");
        result.put("appointmentStatus", appointment == null ? null : "CANCELLED");
        result.put("vehicleStatus", "AVAILABLE");
        result.put("message", "Đã hoàn cọc; lịch hẹn được hủy và xe mở lại AVAILABLE.");
        return result;
    }

    private void requirePending(Appointment appointment) {
        if (!"PENDING".equalsIgnoreCase(appointment.getStatus())) {
            throw new AuthException(HttpStatus.CONFLICT, "Chỉ lịch hẹn PENDING mới được đổi hoặc hủy.");
        }
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        Deposit deposit = appointment.getDepositId() == null ? null
                : depositRepository.findById(appointment.getDepositId()).orElse(null);
        AppUser customer = appUserRepository.findById(appointment.getUserId()).orElse(null);
        Vehicle vehicle = vehicleRepository.findById(appointment.getVehicleId()).orElse(null);
        String vehicleInfo = vehicle == null ? "Xe #" + appointment.getVehicleId()
                : String.join(" ", Stream.of(vehicle.getBrand(), vehicle.getModel(), vehicle.getVariant())
                .filter(value -> value != null && !value.isBlank()).toList());
        return new AppointmentResponse(appointment.getId(), appointment.getId(), appointment.getDepositId(),
                deposit == null ? null : deposit.getDepositCode(), deposit == null ? null : deposit.getStatus(),
                deposit == null ? null : deposit.getAmount(), customer == null ? "Khách hàng" : customer.getFullName(),
                customer == null ? null : customer.getPhone(), vehicleInfo, appointment.getVehicleId(),
                appointment.getAppointmentDate(), appointment.isHasTestDrive(), appointment.getStatus(),
                appointment.getCustomerNote(), appointment.getStaffNote());
    }
}
