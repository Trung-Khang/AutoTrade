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
import com.system.repository.AppUserRepository;
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
    private final AppUserRepository appUserRepository;

    public DepositService(DepositRepository depositRepository,
                          VehicleRepository vehicleRepository,
                          ShowroomRepository showroomRepository,
                          AppointmentRepository appointmentRepository,
                          TransactionLedgerRepository ledgerRepository,
                          com.system.repository.ListingRepository listingRepository,
                          AppUserRepository appUserRepository) {
        this.depositRepository = depositRepository;
        this.vehicleRepository = vehicleRepository;
        this.showroomRepository = showroomRepository;
        this.appointmentRepository = appointmentRepository;
        this.ledgerRepository = ledgerRepository;
        this.listingRepository = listingRepository;
        this.appUserRepository = appUserRepository;
    }

    /**
     * Khởi tạo đơn đặt cọc và hẹn lịch xem xe (kèm tùy chọn lái thử)
     * Trạng thái đơn ban đầu: PENDING
     */
    @Transactional
    public DepositResponse createDeposit(CreateDepositRequest request, Long userId) {
        // 1. Kiểm tra xe tồn tại và trạng thái (hỗ trợ cả vehicleId hoặc listingId)
        Vehicle vehicle = vehicleRepository.findLockedById(request.getVehicleId()).orElse(null);
        if (vehicle == null && listingRepository != null) {
            com.system.entity.Listing listing = listingRepository.findById(request.getVehicleId()).orElse(null);
            if (listing != null) {
                vehicle = listing.getVehicle();
            }
        }

        if (vehicle == null) {
            throw new ResourceNotFoundException("Không tìm thấy xe với ID: " + request.getVehicleId());
        }

        // Re-lock the physical vehicle when a legacy listing ID was supplied.
        Long physicalVehicleId = vehicle.getId();
        vehicle = vehicleRepository.findLockedById(physicalVehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy xe với ID: " + physicalVehicleId));

        String currentStatus = vehicle.getStatus() != null ? vehicle.getStatus().toUpperCase() : "AVAILABLE";
        if (!"AVAILABLE".equals(currentStatus)) {
            throw new VehicleNotAvailableException("Rất tiếc! Xe này hiện tại không thể đặt cọc (Trạng thái hiện tại: " + currentStatus + ").");
        }

        // 2. Kiểm tra showroom (fallback về showroom đầu tiên nếu không tìm thấy)
        Showroom showroom = null;
        if (request.getAppointmentDate() == null) {
            throw new IllegalArgumentException("Ngày giờ hẹn là bắt buộc.");
        }
        Long vehicleShowroomId = vehicle.getShowroomId();
        Long showroomId = vehicleShowroomId;
        if (showroomId == null || request.getShowroomId() == null) {
            throw new IllegalArgumentException("Xe chưa được gắn showroom hợp lệ.");
        }
        if (request.getShowroomId() != null && vehicleShowroomId != null
                && !request.getShowroomId().equals(vehicleShowroomId)) {
            throw new IllegalArgumentException("Showroom đặt lịch không trùng showroom của xe.");
        }
        showroom = showroomRepository.findById(showroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy showroom với ID: " + showroomId));

        // 3. Tính tiền cọc: 10% giá trị xe (hoặc tối thiểu 10.000.000 VNĐ)
        Long assignedStaffId = resolveAssignedStaff(request.getAssignedStaffId(), showroom.getId(),
                request.getAppointmentDate(), false);
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
        appointment.setAssignedStaffId(assignedStaffId);
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
        response.setAssignedStaffId(appointment.getAssignedStaffId());
        if (appointment.getAssignedStaffId() != null) {
            appUserRepository.findById(appointment.getAssignedStaffId()).ifPresent(staff -> {
                response.setAssignedStaffName(staff.getFullName());
                response.setAssignedStaffPhone(staff.getPhone());
            });
        }
        response.setCreatedAt(deposit.getCreatedAt());

        return response;
    }

    private Long resolveAssignedStaff(Long requestedStaffId, Long showroomId,
                                      java.time.LocalDateTime appointmentDate,
                                      boolean allowLegacyUnassigned) {
        if (requestedStaffId != null) {
            com.system.entity.AppUser staff = appUserRepository.findById(requestedStaffId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên được chọn."));
            validateStaffForShowroom(staff, showroomId);
            rejectIfBusy(staff.getId(), appointmentDate);
            return staff.getId();
        }

        List<com.system.entity.AppUser> staffList = appUserRepository
                .findByShowroomIdAndRoleAndActiveTrueAndLockedFalse(showroomId, com.system.entity.Role.STAFF);
        if (staffList.isEmpty() && allowLegacyUnassigned) {
            return null;
        }
        for (com.system.entity.AppUser staff : staffList) {
            if (!appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
                    staff.getId(), appointmentDate, java.util.Set.of("PENDING", "SCHEDULED"))) {
                return staff.getId();
            }
        }

        throw new AuthException(HttpStatus.CONFLICT,
                "Khung giờ này hiện không còn nhân viên trống. Vui lòng chọn giờ khác.");
    }

    private void validateStaffForShowroom(com.system.entity.AppUser staff, Long showroomId) {
        if (staff.getRole() != com.system.entity.Role.STAFF || !staff.isActive() || staff.isLocked()) {
            throw new IllegalArgumentException("Nhân viên được chọn không còn hoạt động.");
        }
        if (!showroomId.equals(staff.getShowroomId())) {
            throw new IllegalArgumentException("Nhân viên không thuộc showroom của xe.");
        }
    }

    private void rejectIfBusy(Long staffId, java.time.LocalDateTime appointmentDate) {
        if (appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
                staffId, appointmentDate, java.util.Set.of("PENDING", "SCHEDULED"))) {
            throw new AuthException(HttpStatus.CONFLICT,
                    "Nhân viên đã kín lịch ở khung giờ này. Vui lòng chọn nhân viên hoặc giờ khác.");
        }
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

    /**
     * Rebuilds the payment screen for an existing pending deposit.
     * This intentionally does not create or mutate a deposit or appointment.
     */
    @Transactional(readOnly = true)
    public DepositResponse getPendingPayment(Long depositId, Long userId) {
        Deposit deposit = depositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn cọc với ID: " + depositId));
        requireOwner(deposit, userId);

        if (!"PENDING".equalsIgnoreCase(deposit.getStatus())) {
            throw new AuthException(HttpStatus.CONFLICT,
                    "Đơn cọc này không còn ở trạng thái chờ thanh toán.");
        }

        Vehicle vehicle = vehicleRepository.findById(deposit.getVehicleId()).orElse(null);
        Showroom showroom = deposit.getShowroomId() == null ? null
                : showroomRepository.findById(deposit.getShowroomId()).orElse(null);
        Appointment appointment = appointmentRepository.findByDepositId(deposit.getId()).orElse(null);

        DepositResponse response = new DepositResponse();
        response.setDepositId(deposit.getId());
        response.setDepositCode(deposit.getDepositCode());
        response.setVehicleId(deposit.getVehicleId());
        if (vehicle != null) {
            response.setVehicleTitle(String.join(" ", java.util.stream.Stream.of(
                    vehicle.getBrand(), vehicle.getModel(), vehicle.getVariant())
                    .filter(value -> value != null && !value.isBlank()).toList()));
        }
        response.setDepositAmount(deposit.getAmount());
        response.setStatus(deposit.getStatus());
        response.setQrPaymentUrl(deposit.getQrCodeUrl());
        response.setCreatedAt(deposit.getCreatedAt());

        if (showroom != null) {
            response.setShowroomName(showroom.getName());
            response.setShowroomAddress(showroom.getAddress());
        }
        if (appointment != null) {
            response.setAppointmentId(appointment.getId());
            response.setAppointmentDate(appointment.getAppointmentDate());
            response.setHasTestDrive(appointment.isHasTestDrive());
            response.setAssignedStaffId(appointment.getAssignedStaffId());
            if (appointment.getAssignedStaffId() != null) {
                appUserRepository.findById(appointment.getAssignedStaffId()).ifPresent(staff -> {
                    response.setAssignedStaffName(staff.getFullName());
                    response.setAssignedStaffPhone(staff.getPhone());
                });
            }
        }
        return response;
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

        Appointment appointment = appointmentRepository.findByDepositId(deposit.getId()).orElse(null);
        if (appointment != null) {
            receipt.setShowroomId(appointment.getShowroomId());
            if (appointment.getShowroomId() != null) {
                showroomRepository.findById(appointment.getShowroomId()).ifPresent(showroom -> {
                    receipt.setShowroomName(showroom.getName());
                    receipt.setShowroomAddress(showroom.getAddress());
                });
            }
            receipt.setAssignedStaffId(appointment.getAssignedStaffId());
            if (appointment.getAssignedStaffId() != null) {
                appUserRepository.findById(appointment.getAssignedStaffId()).ifPresent(staff -> {
                    receipt.setAssignedStaffName(staff.getFullName());
                    receipt.setAssignedStaffPhone(staff.getPhone());
                });
            }
        }

        return receipt;
    }

    /**
     * Lấy danh sách đơn cọc của người dùng (UC-12)
     */
    @Transactional(readOnly = true)
    public List<CustomerDepositResponse> getMyDeposits(Long userId) {
        return depositRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(deposit -> {
            Vehicle vehicle = null;
            com.system.entity.Listing legacyListing = null;
            if (deposit.getVehicleId() != null) {
                vehicle = vehicleRepository.findById(deposit.getVehicleId()).orElse(null);
                if (vehicle == null && listingRepository != null) {
                    legacyListing = listingRepository.findById(deposit.getVehicleId()).orElse(null);
                    if (legacyListing != null) {
                        vehicle = legacyListing.getVehicle();
                    }
                }
            }
            Showroom showroom = deposit.getShowroomId() == null
                    ? null : showroomRepository.findById(deposit.getShowroomId()).orElse(null);
            Appointment appointment = appointmentRepository.findByDepositId(deposit.getId()).orElse(null);
            if (appointment == null && vehicle != null) {
                appointment = appointmentRepository
                        .findFirstByUserIdAndVehicleIdAndDepositIdIsNullOrderByCreatedAtDesc(userId, vehicle.getId())
                        .orElse(null);
            }
            if (appointment == null && deposit.getVehicleId() != null
                    && (vehicle == null || !deposit.getVehicleId().equals(vehicle.getId()))) {
                appointment = appointmentRepository
                        .findFirstByUserIdAndVehicleIdAndDepositIdIsNullOrderByCreatedAtDesc(userId, deposit.getVehicleId())
                        .orElse(null);
            }
            String vehicleTitle = vehicle == null ? null
                    : String.join(" ", java.util.stream.Stream.of(vehicle.getBrand(), vehicle.getModel(), vehicle.getVariant())
                    .filter(value -> value != null && !value.isBlank()).toList());
            BigDecimal vehiclePrice = vehicle == null ? null : vehicle.getPrice();
            if (vehiclePrice == null && legacyListing != null) {
                vehiclePrice = legacyListing.getPrice();
            }
            if (vehiclePrice == null && vehicle != null && listingRepository != null) {
                List<com.system.entity.Listing> listings = listingRepository.findByVehicleId(vehicle.getId());
                if (listings != null && !listings.isEmpty() && listings.get(0).getPrice() != null) {
                    vehiclePrice = listings.get(0).getPrice();
                }
            }
            Long responseVehicleId = vehicle == null ? deposit.getVehicleId() : vehicle.getId();
            return new CustomerDepositResponse(deposit.getId(), deposit.getDepositCode(), deposit.getAmount(),
                    deposit.getStatus(), deposit.getContractNumber(), responseVehicleId, vehicleTitle,
                    vehiclePrice, deposit.getShowroomId(),
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
