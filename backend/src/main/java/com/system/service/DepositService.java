package com.system.service;

import com.system.dto.CreateDepositRequest;
import com.system.dto.DepositResponse;
import com.system.dto.CustomerDepositResponse;
import com.system.dto.ReceiptResponse;
import com.system.entity.Appointment;
import com.system.entity.Deposit;
import com.system.entity.Showroom;
import com.system.entity.TransactionLedger;
import com.system.entity.Vehicle;
import com.system.exception.ResourceNotFoundException;
import com.system.exception.VehicleAlreadyReservedException;
import com.system.exception.VehicleNotAvailableException;
import com.system.exception.AuthException;
import com.system.repository.AppointmentRepository;
import com.system.repository.DepositRepository;
import com.system.repository.ShowroomRepository;
import com.system.repository.TransactionLedgerRepository;
import com.system.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class DepositService {

    private final DepositRepository depositRepository;
    private final VehicleRepository vehicleRepository;
    private final ShowroomRepository showroomRepository;
    private final AppointmentRepository appointmentRepository;
    private final TransactionLedgerRepository ledgerRepository;
    private final com.system.repository.ListingRepository listingRepository;

    public DepositService(DepositRepository depositRepository,
                          VehicleRepository vehicleRepository,
                          ShowroomRepository showroomRepository,
                          AppointmentRepository appointmentRepository,
                          TransactionLedgerRepository ledgerRepository,
                          com.system.repository.ListingRepository listingRepository) {
        this.depositRepository = depositRepository;
        this.vehicleRepository = vehicleRepository;
        this.showroomRepository = showroomRepository;
        this.appointmentRepository = appointmentRepository;
        this.ledgerRepository = ledgerRepository;
        this.listingRepository = listingRepository;
    }

    /**
     * Khởi tạo đơn đặt cọc và hẹn lịch xem xe (kèm tùy chọn lái thử)
     * Trạng thái đơn ban đầu: PENDING
     */
    @Transactional
    public DepositResponse createDeposit(CreateDepositRequest request, Long userId) {
        // 1. Kiểm tra xe tồn tại và trạng thái (hỗ trợ cả vehicleId hoặc listingId)
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId()).orElse(null);
        if (vehicle == null && listingRepository != null) {
            com.system.entity.Listing listing = listingRepository.findById(request.getVehicleId()).orElse(null);
            if (listing != null) {
                vehicle = listing.getVehicle();
            }
        }

        if (vehicle == null) {
            throw new ResourceNotFoundException("Không tìm thấy xe với ID: " + request.getVehicleId());
        }

        String currentStatus = vehicle.getStatus() != null ? vehicle.getStatus().toUpperCase() : "AVAILABLE";
        if ("HOLD".equals(currentStatus) || "RESERVED".equals(currentStatus) || "SOLD".equals(currentStatus)) {
            throw new VehicleNotAvailableException("Rất tiếc! Xe này hiện tại không thể đặt cọc (Trạng thái hiện tại: " + currentStatus + ").");
        }

        // 2. Kiểm tra showroom (fallback về showroom đầu tiên nếu không tìm thấy)
        Showroom showroom = null;
        if (request.getShowroomId() != null) {
            showroom = showroomRepository.findById(request.getShowroomId()).orElse(null);
        }
        if (showroom == null) {
            showroom = showroomRepository.findAll().stream().findFirst()
                    .orElseGet(() -> new Showroom("Showroom AutoTrade Trung Tâm", "Hồ Chí Minh"));
        }

        // 3. Tính tiền cọc: 10% giá trị xe (hoặc tối thiểu 10.000.000 VNĐ)
        BigDecimal vehiclePrice = BigDecimal.ZERO;
        if (listingRepository != null) {
            List<com.system.entity.Listing> listings = listingRepository.findByVehicleId(vehicle.getId());
            if (listings != null && !listings.isEmpty() && listings.get(0).getPrice() != null) {
                vehiclePrice = listings.get(0).getPrice();
            }
        }

        BigDecimal depositAmount;
        if (vehiclePrice.compareTo(BigDecimal.ZERO) > 0) {
            depositAmount = vehiclePrice.multiply(new BigDecimal("0.10")).setScale(0, java.math.RoundingMode.HALF_UP);
        } else {
            depositAmount = new BigDecimal("10000000.00");
        }

        // Sinh mã đơn cọc và URL QR thanh toán Vietcombank - NGUYEN TRUNG KHANG - 1050242933
        String depositCode = "DEP-" + System.currentTimeMillis();
        String mockQrUrl = "https://api.vietqr.io/image/970436-1050242933-compact2.jpg?amount=" 
                + depositAmount.longValue() + "&addInfo=" + depositCode + "&accountName=NGUYEN%20TRUNG%20KHANG";

        Deposit deposit = new Deposit(depositCode, vehicle.getId(), userId, showroom.getId(), depositAmount);
        deposit.setQrCodeUrl(mockQrUrl);
        deposit = depositRepository.save(deposit);

        // 4. Tạo lịch hẹn đến showroom xem xe (Decision D4: hasTestDrive là checkbox)
        Appointment appointment = new Appointment(
                deposit.getId(),
                userId,
                vehicle.getId(),
                showroom.getId(),
                request.getAppointmentDate(),
                request.isHasTestDrive(),
                request.getCustomerNote()
        );
        appointment = appointmentRepository.save(appointment);

        // 5. Chuẩn bị response
        DepositResponse response = new DepositResponse();
        response.setDepositId(deposit.getId());
        response.setDepositCode(deposit.getDepositCode());
        response.setVehicleId(vehicle.getId());
        response.setVehicleTitle(vehicle.getBrand() + " " + vehicle.getModel() + " " + (vehicle.getVariant() != null ? vehicle.getVariant() : ""));
        response.setDepositAmount(deposit.getAmount());
        response.setStatus(deposit.getStatus());
        response.setQrPaymentUrl(deposit.getQrCodeUrl());
        response.setAppointmentId(appointment.getId());
        response.setAppointmentDate(appointment.getAppointmentDate());
        response.setHasTestDrive(appointment.isHasTestDrive());
        response.setShowroomName(showroom.getName());
        response.setShowroomAddress(showroom.getAddress());
        response.setCreatedAt(deposit.getCreatedAt());

        return response;
    }

    /**
     * Xác nhận thanh toán cọc giả lập & Khóa trạng thái xe (Core Technical Highlight)
     * Áp dụng Transaction và Atomic Update chống Race Condition / Đặt cọc trùng (FR-09 & NFR-02)
     */
    @Transactional
    public ReceiptResponse confirmPayment(Long depositId, Long userId) {
        Deposit deposit = depositRepository.findLockedById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn cọc với ID: " + depositId));
        requireOwner(deposit, userId);

        if ("DEPOSITED".equalsIgnoreCase(deposit.getStatus())) {
            return buildReceipt(deposit);
        }
        if (!"PENDING".equalsIgnoreCase(deposit.getStatus())) {
            throw new AuthException(HttpStatus.CONFLICT, "Đơn cọc không còn ở trạng thái chờ xác nhận.");
        }

        // Cập nhật trạng thái xe nguyên tử: chỉ cập nhật thành HOLD nếu status hiện tại là 'AVAILABLE'
        int rowsUpdated = vehicleRepository.updateVehicleStatusIfAvailable(deposit.getVehicleId(), "HOLD");

        if (rowsUpdated == 0) {
            // Không cập nhật được dòng nào -> Xe đã bị khách khác cọc trước trong tích tắc!
            deposit.setStatus("CANCELLED");
            depositRepository.save(deposit);
            throw new VehicleAlreadyReservedException("Rất tiếc! Chiếc xe này vừa được khách hàng khác hoàn tất đặt cọc trước bạn. Giao dịch giữ chỗ đã bị hủy.");
        }

        // Nếu thành công: Cập nhật trạng thái đơn cọc
        deposit.setStatus("DEPOSITED");
        deposit.setConfirmedAt(Instant.now());
        String receiptCode = "REC-" + deposit.getId() + "-" + (System.currentTimeMillis() % 10000);
        String contractNumber = "HD-COC-" + deposit.getId();
        deposit.setReceiptCode(receiptCode);
        deposit.setContractNumber(contractNumber);
        depositRepository.save(deposit);

        // Ghi vào sổ cái tiền cọc TransactionLedger phục vụ Admin
        TransactionLedger ledger = new TransactionLedger(
                deposit.getId(),
                deposit.getAmount(),
                "DEPOSIT_RECEIVED",
                "Khách hàng đã xác nhận thanh toán cọc giả lập giữ xe VIN: " + deposit.getVehicleId()
        );
        ledgerRepository.save(ledger);

        // Chuẩn bị thông tin xe trả về
        Vehicle vehicle = vehicleRepository.findById(deposit.getVehicleId()).orElse(null);

        ReceiptResponse receipt = new ReceiptResponse();
        receipt.setDepositId(deposit.getId());
        receipt.setDepositCode(deposit.getDepositCode());
        receipt.setReceiptCode(receiptCode);
        receipt.setContractNumber(contractNumber);
        receipt.setStatus("DEPOSITED");
        receipt.setVehicleStatus("HOLD");
        receipt.setVehicleId(deposit.getVehicleId());
        if (vehicle != null) {
            receipt.setVehicleTitle(vehicle.getBrand() + " " + vehicle.getModel());
            receipt.setVehicleVin(vehicle.getVin());
        }
        receipt.setDepositAmount(deposit.getAmount());
        receipt.setConfirmedAt(deposit.getConfirmedAt());
        receipt.setMessage("Đặt cọc giữ xe thành công! Phương tiện đã được chuyển sang trạng thái HOLD giữ chỗ.");

        return receipt;
    }

    /**
     * Lấy biên lai và hợp đồng số của đơn cọc (FR-10)
     */
    @Transactional(readOnly = true)
    public ReceiptResponse getReceipt(Long depositId, Long userId) {
        Deposit deposit = depositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn cọc với ID: " + depositId));
        requireOwner(deposit, userId);

        return buildReceipt(deposit);
    }

    private ReceiptResponse buildReceipt(Deposit deposit) {
        Long depositId = deposit.getId();

        Vehicle vehicle = vehicleRepository.findById(deposit.getVehicleId()).orElse(null);

        ReceiptResponse receipt = new ReceiptResponse();
        receipt.setDepositId(deposit.getId());
        receipt.setDepositCode(deposit.getDepositCode());
        receipt.setReceiptCode(deposit.getReceiptCode() != null ? deposit.getReceiptCode() : "CHƯA_CÓ");
        receipt.setContractNumber(deposit.getContractNumber() != null ? deposit.getContractNumber() : "CHƯA_CÓ");
        receipt.setStatus(deposit.getStatus());
        receipt.setVehicleStatus(vehicle != null ? vehicle.getStatus() : "UNKNOWN");
        receipt.setVehicleId(deposit.getVehicleId());
        if (vehicle != null) {
            receipt.setVehicleTitle(vehicle.getBrand() + " " + vehicle.getModel());
            receipt.setVehicleVin(vehicle.getVin());
        }
        receipt.setDepositAmount(deposit.getAmount());
        receipt.setConfirmedAt(deposit.getConfirmedAt());
        receipt.setMessage("Biên lai xác nhận đặt cọc giữ xe.");

        return receipt;
    }

    /**
     * Lấy danh sách đơn cọc của người dùng (UC-12)
     */
    @Transactional(readOnly = true)
    public List<CustomerDepositResponse> getMyDeposits(Long userId) {
        return depositRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(deposit -> {
            Vehicle vehicle = deposit.getVehicleId() == null
                    ? null : vehicleRepository.findById(deposit.getVehicleId()).orElse(null);
            Showroom showroom = deposit.getShowroomId() == null
                    ? null : showroomRepository.findById(deposit.getShowroomId()).orElse(null);
            Appointment appointment = appointmentRepository.findByDepositId(deposit.getId()).orElse(null);
            String vehicleTitle = vehicle == null ? null
                    : String.join(" ", java.util.stream.Stream.of(vehicle.getBrand(), vehicle.getModel(), vehicle.getVariant())
                    .filter(value -> value != null && !value.isBlank()).toList());
            return new CustomerDepositResponse(deposit.getId(), deposit.getDepositCode(), deposit.getAmount(),
                    deposit.getStatus(), deposit.getContractNumber(), deposit.getVehicleId(), vehicleTitle,
                    vehicle == null ? null : vehicle.getPrice(), deposit.getShowroomId(),
                    showroom == null ? null : showroom.getName(),
                    appointment == null ? null : appointment.getId(),
                    appointment == null ? null : appointment.getAppointmentDate(),
                    appointment == null ? null : appointment.getStatus(),
                    appointment != null && appointment.isHasTestDrive(),
                    appointment == null ? null : appointment.getCustomerNote(), deposit.getCreatedAt());
        }).toList();
    }

    private void requireOwner(Deposit deposit, Long userId) {
        if (!deposit.getUserId().equals(userId)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập đơn đặt cọc này.");
        }
    }
}
