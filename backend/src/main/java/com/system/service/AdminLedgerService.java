package com.system.service;

import com.system.entity.Deposit;
import com.system.entity.TransactionLedger;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.DepositRepository;
import com.system.repository.TransactionLedgerRepository;
import com.system.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminLedgerService {

    private final TransactionLedgerRepository ledgerRepository;
    private final DepositRepository depositRepository;
    private final VehicleRepository vehicleRepository;

    public AdminLedgerService(TransactionLedgerRepository ledgerRepository,
                              DepositRepository depositRepository,
                              VehicleRepository vehicleRepository) {
        this.ledgerRepository = ledgerRepository;
        this.depositRepository = depositRepository;
        this.vehicleRepository = vehicleRepository;
    }

    /**
     * Lấy toàn bộ sổ cái giao dịch cọc và tổng tiền cọc đang giữ
     */
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

    /**
     * Admin duyệt hoàn trả tiền cọc cho khách hàng (FR-14)
     * Trạng thái đơn cọc -> REFUNDED
     * Trạng thái xe -> Mở lại thành AVAILABLE để khách khác có thể mua/cọc
     */
    @Transactional
    public Map<String, Object> refundDeposit(Long depositId, String refundReason) {
        Deposit deposit = depositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn cọc với ID: " + depositId));

        deposit.setStatus("REFUNDED");
        depositRepository.save(deposit);

        // Mở lại trạng thái xe thành AVAILABLE
        vehicleRepository.updateVehicleStatus(deposit.getVehicleId(), "AVAILABLE");

        // Ghi nhận bút toán hoàn cọc vào sổ cái
        TransactionLedger refundRecord = new TransactionLedger(
                deposit.getId(),
                deposit.getAmount().negate(), // Số âm biểu thị dòng tiền hoàn trả
                "REFUND",
                "Hoàn trả tiền cọc: " + (refundReason != null ? refundReason : "Theo yêu cầu duyệt của Admin")
        );
        ledgerRepository.save(refundRecord);

        Map<String, Object> result = new HashMap<>();
        result.put("depositId", deposit.getId());
        result.put("status", "REFUNDED");
        result.put("vehicleStatus", "AVAILABLE");
        result.put("message", "Đã duyệt hoàn tiền cọc thành công. Trạng thái xe đã được mở lại thành AVAILABLE.");

        return result;
    }
}
