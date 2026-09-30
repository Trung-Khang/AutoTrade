package com.system.controller;

import com.system.dto.CreateDepositRequest;
import com.system.dto.DepositResponse;
import com.system.dto.ReceiptResponse;
import com.system.entity.Deposit;
import com.system.service.DepositService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deposits")
@Tag(name = "2. Deposit API", description = "Các API xử lý quy trình đặt cọc giữ xe độc bản, thanh toán giả lập QR và xuất biên lai")
public class DepositController {

    private final DepositService depositService;

    public DepositController(DepositService depositService) {
        this.depositService = depositService;
    }

    // 1. Khởi tạo đơn cọc và hẹn lịch xem xe (kèm checkbox lái thử)
    @PostMapping
    @Operation(summary = "Khởi tạo đơn đặt cọc và hẹn lịch xem xe", 
               description = "Khách hàng chọn xe, chọn showroom, ngày giờ hẹn và tùy chọn lái thử. Hệ thống sinh mã QR giả lập thanh toán.")
    public ResponseEntity<DepositResponse> createDeposit(
            @RequestBody CreateDepositRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        DepositResponse response = depositService.createDeposit(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. Xác nhận thanh toán cọc giả lập & Khóa xe sang trạng thái HOLD (Chống cọc trùng)
    @PostMapping("/{id}/confirm")
    @Operation(summary = "Xác nhận đã thanh toán cọc giả lập & Khóa xe HOLD", 
               description = "Quét mã QR và bấm xác nhận chuyển tiền. Áp dụng transaction chống đặt cọc trùng xe.")
    public ResponseEntity<ReceiptResponse> confirmPayment(@PathVariable Long id) {
        ReceiptResponse response = depositService.confirmPayment(id);
        return ResponseEntity.ok(response);
    }

    // 3. Xem biên lai thu tiền cọc và hợp đồng số điện tử
    @GetMapping("/{id}/receipt")
    @Operation(summary = "Xem biên lai thu tiền cọc và hợp đồng số", 
               description = "Hiển thị thông tin biên lai điện tử và hợp đồng cọc để tải hoặc in ấn.")
    public ResponseEntity<ReceiptResponse> getReceipt(@PathVariable Long id) {
        ReceiptResponse response = depositService.getReceipt(id);
        return ResponseEntity.ok(response);
    }

    // 4. Lấy danh sách các đơn cọc của người dùng hiện tại
    @GetMapping("/my")
    @Operation(summary = "Danh sách đơn cọc của tôi", 
               description = "Trả về lịch sử các đơn đặt cọc của khách hàng đang đăng nhập.")
    public ResponseEntity<List<Deposit>> getMyDeposits(
            @RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        List<Deposit> deposits = depositService.getMyDeposits(userId);
        return ResponseEntity.ok(deposits);
    }
}
