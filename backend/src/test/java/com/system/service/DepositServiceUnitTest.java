package com.system.service;

import com.system.dto.CheckInRequest;
import com.system.dto.AppointmentResponse;
import com.system.dto.RescheduleAppointmentRequest;
import com.system.dto.CreateDepositRequest;
import com.system.dto.DepositResponse;
import com.system.dto.CustomerDepositResponse;
import com.system.dto.ReceiptResponse;
import com.system.entity.Appointment;
import com.system.entity.Deposit;
import com.system.entity.Showroom;
import com.system.entity.TransactionLedger;
import com.system.entity.Vehicle;
import com.system.exception.VehicleAlreadyReservedException;
import com.system.exception.VehicleNotAvailableException;
import com.system.repository.AppointmentRepository;
import com.system.repository.AppUserRepository;
import com.system.repository.DepositRepository;
import com.system.repository.ShowroomRepository;
import com.system.repository.TransactionLedgerRepository;
import com.system.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepositServiceUnitTest {

    @Mock
    private DepositRepository depositRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ShowroomRepository showroomRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private TransactionLedgerRepository ledgerRepository;

    @Mock
    private com.system.repository.ListingRepository listingRepository;

    @InjectMocks
    private DepositService depositService;

    @InjectMocks
    private AppointmentService appointmentService;

    @InjectMocks
    private AdminLedgerService adminLedgerService;

    private Vehicle sampleVehicle;
    private Showroom sampleShowroom;
    private Deposit sampleDeposit;

    @BeforeEach
    void setUp() {
        sampleVehicle = new Vehicle();
        sampleVehicle.setId(1L);
        sampleVehicle.setVin("VN-TOYOTA-CAMRY-2021-001");
        sampleVehicle.setBrand("Toyota");
        sampleVehicle.setModel("Camry");
        sampleVehicle.setStatus("AVAILABLE");
        sampleVehicle.setShowroomId(10L);
        lenient().when(vehicleRepository.findLockedById(1L)).thenReturn(Optional.of(sampleVehicle));

        sampleShowroom = new Showroom("Showroom Thủ Đức", "Số 1 Võ Văn Ngân, Thủ Đức", "0901234567", "TP.HCM");
        sampleShowroom.setId(10L);

        sampleDeposit = new Deposit("DEP-20260930-1001", 1L, 100L, 10L, new BigDecimal("10000000.00"));
        sampleDeposit.setId(50L);
        sampleDeposit.setStatus("PENDING");
    }

    @Test
    @DisplayName("Lịch sử đơn cọc map đầy đủ dữ liệu và chỉ truy vấn user hiện tại")
    void getMyDepositsMapsJoinedDetailsForAuthenticatedOwner() {
        sampleVehicle.setVariant("2.5Q");
        sampleVehicle.setPrice(new BigDecimal("1050000000.00"));
        sampleDeposit.setContractNumber("HD-COC-2026-0001");
        Instant createdAt = Instant.parse("2026-10-02T04:15:00Z");
        sampleDeposit.setCreatedAt(createdAt);
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L,
                LocalDateTime.parse("2026-10-05T09:30:00"), true, "Xem xe buổi sáng");
        appointment.setId(15L);
        appointment.setStatus("PENDING");

        when(depositRepository.findByUserIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(sampleDeposit));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));
        when(showroomRepository.findById(10L)).thenReturn(Optional.of(sampleShowroom));
        when(appointmentRepository.findByDepositId(50L)).thenReturn(Optional.of(appointment));

        List<CustomerDepositResponse> result = depositService.getMyDeposits(100L);

        assertEquals(1, result.size());
        CustomerDepositResponse response = result.get(0);
        assertEquals(50L, response.depositId());
        assertEquals("DEP-20260930-1001", response.depositCode());
        assertEquals(new BigDecimal("10000000.00"), response.depositAmount());
        assertEquals("PENDING", response.status());
        assertEquals("HD-COC-2026-0001", response.contractNumber());
        assertEquals(1L, response.vehicleId());
        assertEquals("Toyota Camry 2.5Q", response.vehicleTitle());
        assertEquals(new BigDecimal("1050000000.00"), response.vehiclePrice());
        assertEquals(10L, response.showroomId());
        assertEquals("Showroom Thủ Đức", response.showroomName());
        assertEquals(15L, response.appointmentId());
        assertEquals(LocalDateTime.parse("2026-10-05T09:30:00"), response.appointmentDate());
        assertEquals("PENDING", response.appointmentStatus());
        assertTrue(response.hasTestDrive());
        assertEquals("Xem xe buổi sáng", response.customerNote());
        assertEquals(createdAt, response.createdAt());
        verify(depositRepository).findByUserIdOrderByCreatedAtDesc(100L);
        verify(depositRepository, never()).findAll();
    }

    @Test
    @DisplayName("Thiếu dữ liệu liên kết vẫn trả lịch sử với các trường mở rộng null")
    void getMyDepositsHandlesMissingRelatedRows() {
        sampleDeposit.setVehicleId(404L);
        sampleDeposit.setShowroomId(405L);
        when(depositRepository.findByUserIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(sampleDeposit));
        when(vehicleRepository.findById(404L)).thenReturn(Optional.empty());
        when(showroomRepository.findById(405L)).thenReturn(Optional.empty());
        when(appointmentRepository.findByDepositId(50L)).thenReturn(Optional.empty());

        CustomerDepositResponse response = depositService.getMyDeposits(100L).get(0);

        assertEquals(50L, response.depositId());
        assertEquals(404L, response.vehicleId());
        assertNull(response.vehicleTitle());
        assertNull(response.vehiclePrice());
        assertEquals(405L, response.showroomId());
        assertNull(response.showroomName());
        assertNull(response.appointmentId());
        assertNull(response.appointmentDate());
        assertNull(response.appointmentStatus());
        assertFalse(response.hasTestDrive());
        assertNull(response.customerNote());
    }

    @Test
    @DisplayName("1. Khởi tạo đơn cọc thành công khi xe AVAILABLE và có tùy chọn lái thử")
    void testCreateDeposit_Success() {
        CreateDepositRequest request = new CreateDepositRequest();
        request.setVehicleId(1L);
        request.setShowroomId(10L);
        request.setAppointmentDate(LocalDateTime.now().plusDays(2));
        request.setHasTestDrive(true); // Checkbox lái thử
        request.setCustomerNote("Muốn lái thử");

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));
        when(showroomRepository.findById(10L)).thenReturn(Optional.of(sampleShowroom));
        when(depositRepository.save(any(Deposit.class))).thenAnswer(i -> {
            Deposit d = i.getArgument(0);
            d.setId(50L);
            return d;
        });
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(99L);
            return a;
        });
        when(appUserRepository.findByShowroomIdAndRoleAndActiveTrueAndLockedFalse(
                eq(10L), eq(com.system.entity.Role.STAFF)))
                .thenReturn(List.of(availableStaff(20L, 10L)));

        DepositResponse response = depositService.createDeposit(request, 100L);

        assertNotNull(response);
        assertEquals(50L, response.getDepositId());
        assertEquals("PENDING", response.getStatus());
        assertTrue(response.isHasTestDrive(), "Lịch hẹn phải ghi nhận tùy chọn lái thử");
        assertNotNull(response.getQrPaymentUrl(), "Phải tự động sinh link mã QR thanh toán giả lập");
        verify(depositRepository, times(1)).save(any(Deposit.class));
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Gán đúng Staff cùng showroom khi khách chọn nhân viên còn trống")
    void createDepositAssignsSelectedAvailableStaff() {
        sampleVehicle.setShowroomId(10L);
        CreateDepositRequest request = new CreateDepositRequest();
        request.setVehicleId(1L);
        request.setShowroomId(10L);
        request.setAssignedStaffId(21L);
        request.setAppointmentDate(LocalDateTime.now().plusDays(2));

        com.system.entity.AppUser staff = new com.system.entity.AppUser();
        org.springframework.test.util.ReflectionTestUtils.setField(staff, "id", 21L);
        staff.setRole(com.system.entity.Role.STAFF);
        staff.setActive(true);
        staff.setLocked(false);
        staff.setShowroomId(10L);
        staff.setFullName("Staff Test");

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));
        when(showroomRepository.findById(10L)).thenReturn(Optional.of(sampleShowroom));
        when(appUserRepository.findById(21L)).thenReturn(Optional.of(staff));
        when(appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
                eq(21L), eq(request.getAppointmentDate()), any())).thenReturn(false);
        when(depositRepository.save(any(Deposit.class))).thenAnswer(i -> {
            Deposit d = i.getArgument(0);
            d.setId(50L);
            return d;
        });
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(99L);
            return a;
        });

        depositService.createDeposit(request, 100L);

        ArgumentCaptor<Appointment> captor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(captor.capture());
        assertEquals(21L, captor.getValue().getAssignedStaffId());
    }

    @Test
    @DisplayName("Không tạo cọc khi Staff được chọn đã kín lịch")
    void createDepositRejectsBusySelectedStaff() {
        sampleVehicle.setShowroomId(10L);
        CreateDepositRequest request = new CreateDepositRequest();
        request.setVehicleId(1L);
        request.setShowroomId(10L);
        request.setAssignedStaffId(21L);
        request.setAppointmentDate(LocalDateTime.now().plusDays(2));

        com.system.entity.AppUser staff = new com.system.entity.AppUser();
        org.springframework.test.util.ReflectionTestUtils.setField(staff, "id", 21L);
        staff.setRole(com.system.entity.Role.STAFF);
        staff.setActive(true);
        staff.setShowroomId(10L);

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));
        when(showroomRepository.findById(10L)).thenReturn(Optional.of(sampleShowroom));
        when(appUserRepository.findById(21L)).thenReturn(Optional.of(staff));
        when(appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
                eq(21L), eq(request.getAppointmentDate()), any())).thenReturn(true);

        assertThrows(com.system.exception.AuthException.class,
                () -> depositService.createDeposit(request, 100L));
        verify(depositRepository, never()).save(any(Deposit.class));
    }

    @Test
    void createDepositRejectsWhenAllShowroomStaffAreBusy() {
        sampleVehicle.setShowroomId(10L);
        CreateDepositRequest request = new CreateDepositRequest();
        request.setVehicleId(1L);
        request.setShowroomId(10L);
        request.setAppointmentDate(LocalDateTime.now().plusDays(2));

        com.system.entity.AppUser firstStaff = availableStaff(21L, 10L);
        com.system.entity.AppUser secondStaff = availableStaff(22L, 10L);

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));
        when(showroomRepository.findById(10L)).thenReturn(Optional.of(sampleShowroom));
        when(appUserRepository.findByShowroomIdAndRoleAndActiveTrueAndLockedFalse(
                10L, com.system.entity.Role.STAFF)).thenReturn(List.of(firstStaff, secondStaff));
        when(appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
                anyLong(), eq(request.getAppointmentDate()), any())).thenReturn(true);

        com.system.exception.AuthException error = assertThrows(com.system.exception.AuthException.class,
                () -> depositService.createDeposit(request, 100L));

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, error.getStatus());
        verify(depositRepository, never()).save(any(Deposit.class));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void createDepositRejectsAnyNonAvailableVehicleStatus() {
        sampleVehicle.setStatus("ARCHIVED");
        CreateDepositRequest request = new CreateDepositRequest();
        request.setVehicleId(1L);
        request.setShowroomId(10L);
        request.setAppointmentDate(LocalDateTime.now().plusDays(2));

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));

        assertThrows(VehicleNotAvailableException.class, () -> depositService.createDeposit(request, 100L));
        verify(depositRepository, never()).save(any(Deposit.class));
    }

    private com.system.entity.AppUser availableStaff(Long id, Long showroomId) {
        com.system.entity.AppUser staff = new com.system.entity.AppUser();
        org.springframework.test.util.ReflectionTestUtils.setField(staff, "id", id);
        staff.setRole(com.system.entity.Role.STAFF);
        staff.setActive(true);
        staff.setLocked(false);
        staff.setShowroomId(showroomId);
        return staff;
    }

    @Test
    @DisplayName("2. Báo lỗi khi đặt cọc xe đang ở trạng thái HOLD (không AVAILABLE)")
    void testCreateDeposit_VehicleNotAvailable_ThrowsException() {
        sampleVehicle.setStatus("HOLD"); // Xe đang bị giữ chỗ

        CreateDepositRequest request = new CreateDepositRequest();
        request.setVehicleId(1L);
        request.setShowroomId(10L);

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));

        assertThrows(VehicleNotAvailableException.class, () -> {
            depositService.createDeposit(request, 100L);
        });

        verify(depositRepository, never()).save(any(Deposit.class));
    }

    @Test
    @DisplayName("3. Xác nhận thanh toán cọc giả lập thành công & Khóa xe HOLD")
    void testConfirmPayment_Success() {
        // Giả lập câu lệnh UPDATE nguyên tử thành công (1 dòng được cập nhật)
        when(vehicleRepository.updateVehicleStatusIfAvailable(1L, "HOLD")).thenReturn(1);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));

        when(depositRepository.findLockedById(50L)).thenReturn(Optional.of(sampleDeposit));
        ReceiptResponse receipt = depositService.confirmPayment(50L, 100L);

        assertNotNull(receipt);
        assertEquals("DEPOSITED", receipt.getStatus(), "Trạng thái cọc phải chuyển thành DEPOSITED");
        assertEquals("HOLD", receipt.getVehicleStatus(), "Trạng thái xe phải chuyển thành HOLD");
        assertNotNull(receipt.getReceiptCode(), "Phải sinh mã biên lai điện tử");
        assertNotNull(receipt.getContractNumber(), "Phải sinh số hợp đồng cọc");

        verify(ledgerRepository, times(1)).save(any(TransactionLedger.class));
    }

    @Test
    @DisplayName("4. CHỐNG CỌC TRÙNG: Khi xe vừa bị người khác cọc trước -> Ném ngoại lệ 409 Conflict")
    void testConfirmPayment_RaceCondition_VehicleAlreadyReserved() {
        when(depositRepository.findLockedById(50L)).thenReturn(Optional.of(sampleDeposit));
        // Giả lập UPDATE trả về 0 dòng vì xe đã bị người khác cọc trước trong cùng mili-giây
        when(vehicleRepository.updateVehicleStatusIfAvailable(1L, "HOLD")).thenReturn(0);

        assertThrows(VehicleAlreadyReservedException.class, () -> {
            depositService.confirmPayment(50L, 100L);
        });

        // Kiểm tra đơn cọc phải chuyển sang CANCELLED
        assertEquals("CANCELLED", sampleDeposit.getStatus());
        verify(depositRepository, times(1)).save(sampleDeposit);
    }

    @Test
    @DisplayName("Không cho CUSTOMER khác confirm hoặc đọc biên lai đơn cọc")
    void depositOwnerIsRequiredForConfirmAndReceipt() {
        when(depositRepository.findLockedById(50L)).thenReturn(Optional.of(sampleDeposit));
        when(depositRepository.findById(50L)).thenReturn(Optional.of(sampleDeposit));
        assertThrows(com.system.exception.AuthException.class, () -> depositService.confirmPayment(50L, 999L));
        assertThrows(com.system.exception.AuthException.class, () -> depositService.getReceipt(50L, 999L));
        verify(vehicleRepository, never()).updateVehicleStatusIfAvailable(any(), any());
    }

    @Test
    @DisplayName("5. Staff đón tiếp khách và xác nhận hoàn tất lái thử (Check-in)")
    void testStaffCheckIn_CompletedWithTestDrive() {
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L, LocalDateTime.now(), true, "Lái thử");
        appointment.setId(88L);
        appointment.setStatus("PENDING");

        AppointmentRepository mockAppRepo = mock(AppointmentRepository.class);
        AppointmentService appService = new AppointmentService(mockAppRepo);

        when(mockAppRepo.findLockedById(88L)).thenReturn(Optional.of(appointment));
        when(mockAppRepo.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

        CheckInRequest request = new CheckInRequest();
        request.setTestDriveCompleted(true);
        request.setStaffNote("Khách hàng đã lái thử an toàn và hài lòng.");

        Appointment result = appService.checkIn(88L, request);

        assertEquals("COMPLETED", result.getStatus());
        assertTrue(result.isHasTestDrive());
        assertEquals("Khách hàng đã lái thử an toàn và hài lòng.", result.getStaffNote());
    }

    @Test
    @DisplayName("Không check-in lịch khi đơn cọc chưa thanh toán")
    void unpaidDepositAppointmentCannotBeCheckedIn() {
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L,
                LocalDateTime.now(), true, "Lái thử");
        appointment.setId(89L);
        appointment.setStatus("PENDING");
        when(appointmentRepository.findLockedById(89L)).thenReturn(Optional.of(appointment));
        when(depositRepository.findById(50L)).thenReturn(Optional.of(sampleDeposit));

        assertThrows(com.system.exception.AuthException.class,
                () -> appointmentService.checkIn(89L, new CheckInRequest()));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Danh sách Admin không trả lịch của đơn cọc PENDING")
    void adminAppointmentListExcludesUnpaidDeposit() {
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L,
                LocalDateTime.now(), true, null);
        appointment.setId(92L);
        appointment.setStatus("PENDING");
        when(appointmentRepository.findAll()).thenReturn(List.of(appointment));
        when(depositRepository.findById(50L)).thenReturn(Optional.of(sampleDeposit));

        assertTrue(adminLedgerService.getAppointments().isEmpty());
    }

    @Test
    @DisplayName("6. Admin duyệt hoàn tiền cọc -> Mở lại xe về AVAILABLE")
    void testAdminRefundDeposit() {
        sampleDeposit.setStatus("DEPOSITED");

        DepositRepository mockDepRepo = mock(DepositRepository.class);
        VehicleRepository mockVehRepo = mock(VehicleRepository.class);
        TransactionLedgerRepository mockLedgerRepo = mock(TransactionLedgerRepository.class);
        AppointmentRepository mockAppointmentRepo = mock(AppointmentRepository.class);
        AppUserRepository mockUserRepo = mock(AppUserRepository.class);
        ShowroomRepository mockShowroomRepo = mock(ShowroomRepository.class);
        AdminLedgerService ledgerService = new AdminLedgerService(mockLedgerRepo, mockDepRepo, mockVehRepo,
                mockAppointmentRepo, mockUserRepo, mockShowroomRepo);

        when(mockDepRepo.findLockedById(50L)).thenReturn(Optional.of(sampleDeposit));
        when(mockAppointmentRepo.findLockedByDepositId(50L)).thenReturn(Optional.empty());
        when(mockVehRepo.releaseVehicleHold(1L)).thenReturn(1);

        Map<String, Object> result = ledgerService.refundDeposit(50L, "Xe lỗi ngoại quan");

        assertEquals("REFUNDED", result.get("status"));
        assertEquals("AVAILABLE", result.get("vehicleStatus"));
        verify(mockVehRepo, times(1)).releaseVehicleHold(1L);
        verify(mockLedgerRepo, times(1)).save(any(TransactionLedger.class));
    }

    @Test
    @DisplayName("Admin hủy lịch PENDING hoàn deposit, mở xe và ghi đúng một ledger âm")
    void adminCancelRefundIsAtomicBusinessTransition() {
        sampleDeposit.setStatus("DEPOSITED");
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L, LocalDateTime.now().plusDays(2), false, null);
        appointment.setId(77L);
        appointment.setStatus("PENDING");
        when(depositRepository.findLockedById(50L)).thenReturn(Optional.of(sampleDeposit));
        when(appointmentRepository.findById(77L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.findLockedById(77L)).thenReturn(Optional.of(appointment));
        when(vehicleRepository.releaseVehicleHold(1L)).thenReturn(1);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminLedgerService.cancelAppointment(77L, "Khách yêu cầu hủy");

        assertEquals("CANCELLED", appointment.getStatus());
        assertEquals("REFUNDED", sampleDeposit.getStatus());
        verify(ledgerRepository).save(argThat(entry -> "REFUND".equals(entry.getTransactionType())
                && entry.getAmount().compareTo(new BigDecimal("-10000000.00")) == 0
                && "CONFIRMED".equals(entry.getStatus())));
    }

    @Test
    @DisplayName("Không hoàn cọc lần hai và không ghi thêm ledger")
    void repeatedRefundIsRejectedWithoutSecondLedger() {
        sampleDeposit.setStatus("REFUNDED");
        when(depositRepository.findLockedById(50L)).thenReturn(Optional.of(sampleDeposit));
        when(appointmentRepository.findLockedByDepositId(50L)).thenReturn(Optional.empty());

        assertThrows(com.system.exception.AuthException.class,
                () -> adminLedgerService.refundDeposit(50L, "Lặp lại"));
        verify(ledgerRepository, never()).save(any(TransactionLedger.class));
    }

    @Test
    @DisplayName("Lỗi cập nhật xe không ghi bút toán hoàn tiền")
    void refundFailureDoesNotWriteLedger() {
        sampleDeposit.setStatus("DEPOSITED");
        when(depositRepository.findLockedById(50L)).thenReturn(Optional.of(sampleDeposit));
        when(appointmentRepository.findLockedByDepositId(50L)).thenReturn(Optional.empty());
        when(vehicleRepository.releaseVehicleHold(1L)).thenReturn(0);
        assertThrows(com.system.exception.AuthException.class, () -> adminLedgerService.refundDeposit(50L, "test"));
        verify(ledgerRepository, never()).save(any(TransactionLedger.class));
    }

    @Test
    @DisplayName("Staff không check-in lịch đã hủy")
    void staffCannotCheckInCancelledAppointment() {
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L, LocalDateTime.now(), false, null);
        appointment.setId(88L);
        appointment.setStatus("CANCELLED");
        when(appointmentRepository.findLockedById(88L)).thenReturn(Optional.of(appointment));
        assertThrows(com.system.exception.AuthException.class,
                () -> appointmentService.checkIn(88L, new CheckInRequest()));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Admin đổi lịch PENDING thành công và giữ nguyên status")
    void adminReschedulesPendingAppointment() {
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L, LocalDateTime.now().plusDays(1), false, null);
        appointment.setId(90L);
        appointment.setStatus("PENDING");
        LocalDateTime newDate = LocalDateTime.now().plusDays(4);
        sampleDeposit.setStatus("DEPOSITED");
        when(appointmentRepository.findLockedById(90L)).thenReturn(Optional.of(appointment));
        when(depositRepository.findById(50L)).thenReturn(Optional.of(sampleDeposit));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentResponse response = adminLedgerService.reschedule(90L,
                new RescheduleAppointmentRequest(newDate, "Khách bận"));

        assertEquals(newDate, response.appointmentDate());
        assertEquals("PENDING", appointment.getStatus());
        assertNotNull(appointment.getUpdatedAt());
    }

    @Test
    @DisplayName("Không cho đổi lịch COMPLETED")
    void completedAppointmentCannotBeRescheduled() {
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L, LocalDateTime.now(), false, null);
        appointment.setId(91L);
        appointment.setStatus("COMPLETED");
        when(appointmentRepository.findLockedById(91L)).thenReturn(Optional.of(appointment));
        assertThrows(com.system.exception.AuthException.class, () -> adminLedgerService.reschedule(91L,
                new RescheduleAppointmentRequest(LocalDateTime.now().plusDays(2), "test")));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Khôi phục đúng đơn PENDING mà không tạo lại đơn hoặc lịch hẹn")
    void getPendingPaymentReturnsExistingDepositDetails() {
        sampleVehicle.setVariant("2.5Q");
        sampleDeposit.setCreatedAt(Instant.parse("2026-10-02T04:15:00Z"));
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L,
                LocalDateTime.parse("2026-10-05T09:30:00"), true, "Xem xe");
        appointment.setId(15L);
        appointment.setAssignedStaffId(20L);
        when(depositRepository.findById(50L)).thenReturn(Optional.of(sampleDeposit));
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));
        when(showroomRepository.findById(10L)).thenReturn(Optional.of(sampleShowroom));
        when(appointmentRepository.findByDepositId(50L)).thenReturn(Optional.of(appointment));
        com.system.entity.AppUser staff = new com.system.entity.AppUser();
        staff.setFullName("Nhân viên thật");
        staff.setPhone("0900000001");
        when(appUserRepository.findById(20L)).thenReturn(Optional.of(staff));

        DepositResponse response = depositService.getPendingPayment(50L, 100L);

        assertEquals(50L, response.getDepositId());
        assertEquals("PENDING", response.getStatus());
        assertEquals(15L, response.getAppointmentId());
        assertEquals(20L, response.getAssignedStaffId());
        verify(depositRepository, never()).save(any(Deposit.class));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }
}
