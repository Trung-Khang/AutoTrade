package com.system.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deposit_id")
    private Long depositId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "showroom_id", nullable = false)
    private Long showroomId;

    // Thời gian khách hàng hẹn đến Showroom xem xe thực tế
    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate;

    // Quyết định khóa D4: Lái thử chỉ là checkbox thuộc lịch hẹn, không có quy trình riêng
    @Column(name = "has_test_drive", nullable = false)
    private boolean hasTestDrive = false;

    // Trạng thái đón tiếp: PENDING (Chờ khách đến), COMPLETED (Đã tiếp đón), CANCELLED (Khách hủy)
    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING";

    // Ghi chú của khách hàng khi đặt hẹn
    @Column(name = "customer_note", length = 500)
    private String customerNote;

    // Ghi chú nghiệp vụ của Nhân viên Showroom (Staff) khi tiếp đón/lái thử
    @Column(name = "staff_note", length = 500)
    private String staffNote;

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Appointment() {
    }

    public Appointment(Long depositId, Long userId, Long vehicleId, Long showroomId, 
                       LocalDateTime appointmentDate, boolean hasTestDrive, String customerNote) {
        this.depositId = depositId;
        this.userId = userId;
        this.vehicleId = vehicleId;
        this.showroomId = showroomId;
        this.appointmentDate = appointmentDate;
        this.hasTestDrive = hasTestDrive;
        this.customerNote = customerNote;
        this.status = "PENDING";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDepositId() {
        return depositId;
    }

    public void setDepositId(Long depositId) {
        this.depositId = depositId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getShowroomId() {
        return showroomId;
    }

    public void setShowroomId(Long showroomId) {
        this.showroomId = showroomId;
    }

    public LocalDateTime getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDateTime appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public boolean isHasTestDrive() {
        return hasTestDrive;
    }

    public void setHasTestDrive(boolean hasTestDrive) {
        this.hasTestDrive = hasTestDrive;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public void setCustomerNote(String customerNote) {
        this.customerNote = customerNote;
    }

    public String getStaffNote() {
        return staffNote;
    }

    public void setStaffNote(String staffNote) {
        this.staffNote = staffNote;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
