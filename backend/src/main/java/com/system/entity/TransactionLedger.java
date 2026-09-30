package com.system.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transaction_ledger")
public class TransactionLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deposit_id", nullable = false)
    private Long depositId;

    // Số tiền giao dịch cọc (VND)
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // Loại giao dịch: DEPOSIT_RECEIVED (Nhận cọc), REFUND (Hoàn trả cọc), FORFEIT (Quá hạn tịch thu)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType;

    // Trạng thái: CONFIRMED, PROCESSED, REVERSED
    @Column(name = "status", nullable = false, length = 30)
    private String status = "CONFIRMED";

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public TransactionLedger() {
    }

    public TransactionLedger(Long depositId, BigDecimal amount, String transactionType, String note) {
        this.depositId = depositId;
        this.amount = amount;
        this.transactionType = transactionType;
        this.status = "CONFIRMED";
        this.note = note;
        this.createdAt = Instant.now();
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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
