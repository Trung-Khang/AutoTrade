package com.system.controller;

import com.system.service.AdminLedgerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ledger")
@Tag(name = "4. Admin Ledger API", description = "Các API cho Admin giám sát sổ cái dòng tiền cọc và duyệt hoàn cọc")
public class AdminLedgerController {

    private final AdminLedgerService ledgerService;

    public AdminLedgerController(AdminLedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    // 1. Xem tổng quan sổ cái dòng tiền cọc
    @GetMapping
    @Operation(summary = "Xem tổng quan sổ cái tiền cọc", 
               description = "Hiển thị tổng số giao dịch cọc, tổng số tiền cọc đang giữ và lịch sử các bút toán.")
    public ResponseEntity<Map<String, Object>> getLedgerOverview() {
        Map<String, Object> data = ledgerService.getLedgerOverview();
        return ResponseEntity.ok(data);
    }

    // 2. Admin duyệt hoàn tiền cọc cho khách hàng
    @PostMapping("/{depositId}/refund")
    @Operation(summary = "Duyệt hoàn trả tiền cọc cho khách", 
               description = "Xử lý hoàn cọc: Chuyển đơn cọc sang REFUNDED và mở lại xe về AVAILABLE.")
    public ResponseEntity<Map<String, Object>> refundDeposit(
            @PathVariable Long depositId,
            @RequestParam(required = false) String refundReason) {
        Map<String, Object> result = ledgerService.refundDeposit(depositId, refundReason);
        return ResponseEntity.ok(result);
    }
}
