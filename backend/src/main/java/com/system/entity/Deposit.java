package com.system.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "deposits")
public class Deposit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã đơn đặt cọc duy nhất (VD: DEP-20260930-1001)
    @Column(name = "deposit_code", nullable = false, unique = true, length = 50)
    private String depositCode;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "showroom_id", nullable = false)
    private Long showroomId;

    // Số tiền đặt cọc (VND) - Thường là 10.000.000 hoặc tỷ lệ % giá xe
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // Trạng thái đơn cọc: PENDING (Chờ thanh toán QR), DEPOSITED (Đã thanh toán & giữ xe), CANCELLED, REFUNDED
    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING";

    // Đường dẫn ảnh mã QR thanh toán giả lập
    @Column(name = "qr_code_url", length = 500)
    private String qrCodeUrl;

    // Mã biên lai điện tử sau khi thanh toán thành công
    @Column(name = "receipt_code", length = 50)
    private String receiptCode;

    // Số hợp đồng đặt cọc số
    @Column(name = "contract_number", length = 50)
    private String contractNumber;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // Thời điểm khách hàng xác nhận đã chuyển tiền cọc
    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    public Deposit() {
    }

    public Deposit(String depositCode, Long vehicleId, Long userId, Long showroomId, BigDecimal amount) {
        this.depositCode = depositCode;
        this.vehicleId = vehicleId;
        this.userId = userId;
        this.showroomId = showroomId;
        this.amount = amount;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getShowroomId() {
        return showroomId;
    }

    public void setShowroomId(Long showroomId) {
        this.showroomId = showroomId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public String getReceiptCode() {
        return receiptCode;
    }

    public void setReceiptCode(String receiptCode) {
        this.receiptCode = receiptCode;
    }

    public String getContractNumber() {
        return contractNumber;
    }

    public void setContractNumber(String contractNumber) {
        this.contractNumber = contractNumber;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
}
