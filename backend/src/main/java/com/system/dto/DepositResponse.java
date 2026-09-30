package com.system.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public class DepositResponse {

    private Long depositId;
    private String depositCode;
    private Long vehicleId;
    private String vehicleTitle;
    private BigDecimal depositAmount;
    private String status;
    private String qrPaymentUrl;
    private Long appointmentId;
    private LocalDateTime appointmentDate;
    private boolean hasTestDrive;
    private String showroomName;
    private String showroomAddress;
    private Instant createdAt;

    public DepositResponse() {
    }

    public Long getDepositId() {
        return depositId;
    }

    public void setDepositId(Long depositId) {
        this.depositId = depositId;
    }

    public String getDepositCode() {
        return depositCode;
    }

    public void setDepositCode(String depositCode) {
        this.depositCode = depositCode;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleTitle() {
        return vehicleTitle;
    }

    public void setVehicleTitle(String vehicleTitle) {
        this.vehicleTitle = vehicleTitle;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrPaymentUrl() {
        return qrPaymentUrl;
    }

    public void setQrPaymentUrl(String qrPaymentUrl) {
        this.qrPaymentUrl = qrPaymentUrl;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
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

    public String getShowroomName() {
        return showroomName;
    }

    public void setShowroomName(String showroomName) {
        this.showroomName = showroomName;
    }

    public String getShowroomAddress() {
        return showroomAddress;
    }

    public void setShowroomAddress(String showroomAddress) {
        this.showroomAddress = showroomAddress;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
