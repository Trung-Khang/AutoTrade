package com.system.service;

import com.system.dto.CheckInRequest;
import com.system.dto.CreateDepositRequest;
import com.system.dto.DepositResponse;
import com.system.dto.ReceiptResponse;
import com.system.entity.Appointment;
import com.system.entity.Deposit;
import com.system.entity.Showroom;
import com.system.entity.TransactionLedger;
import com.system.entity.Vehicle;
import com.system.exception.VehicleAlreadyReservedException;
import com.system.exception.VehicleNotAvailableException;
import com.system.repository.AppointmentRepository;
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
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    private TransactionLedgerRepository ledgerRepository;

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

        sampleShowroom = new Showroom("Showroom Thủ Đức", "Số 1 Võ Văn Ngân, Thủ Đức", "0901234567", "TP.HCM");
        sampleShowroom.setId(10L);

        sampleDeposit = new Deposit("DEP-20260930-1001", 1L, 100L, 10L, new BigDecimal("10000000.00"));
        sampleDeposit.setId(50L);
        sampleDeposit.setStatus("PENDING");
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
        when(depositRepository.findById(50L)).thenReturn(Optional.of(sampleDeposit));
        // Giả lập câu lệnh UPDATE nguyên tử thành công (1 dòng được cập nhật)
        when(vehicleRepository.updateVehicleStatusIfAvailable(1L, "HOLD")).thenReturn(1);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(sampleVehicle));

        ReceiptResponse receipt = depositService.confirmPayment(50L);

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
        when(depositRepository.findById(50L)).thenReturn(Optional.of(sampleDeposit));
        // Giả lập UPDATE trả về 0 dòng vì xe đã bị người khác cọc trước trong cùng mili-giây
        when(vehicleRepository.updateVehicleStatusIfAvailable(1L, "HOLD")).thenReturn(0);

        assertThrows(VehicleAlreadyReservedException.class, () -> {
            depositService.confirmPayment(50L);
        });

        // Kiểm tra đơn cọc phải chuyển sang CANCELLED
        assertEquals("CANCELLED", sampleDeposit.getStatus());
        verify(depositRepository, times(1)).save(sampleDeposit);
    }

    @Test
    @DisplayName("5. Staff đón tiếp khách và xác nhận hoàn tất lái thử (Check-in)")
    void testStaffCheckIn_CompletedWithTestDrive() {
        Appointment appointment = new Appointment(50L, 100L, 1L, 10L, LocalDateTime.now(), true, "Lái thử");
        appointment.setId(88L);
        appointment.setStatus("PENDING");

        AppointmentRepository mockAppRepo = mock(AppointmentRepository.class);
        AppointmentService appService = new AppointmentService(mockAppRepo);

        when(mockAppRepo.findById(88L)).thenReturn(Optional.of(appointment));
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
    @DisplayName("6. Admin duyệt hoàn tiền cọc -> Mở lại xe về AVAILABLE")
    void testAdminRefundDeposit() {
        sampleDeposit.setStatus("DEPOSITED");

        DepositRepository mockDepRepo = mock(DepositRepository.class);
        VehicleRepository mockVehRepo = mock(VehicleRepository.class);
        TransactionLedgerRepository mockLedgerRepo = mock(TransactionLedgerRepository.class);
        AdminLedgerService ledgerService = new AdminLedgerService(mockLedgerRepo, mockDepRepo, mockVehRepo);

        when(mockDepRepo.findById(50L)).thenReturn(Optional.of(sampleDeposit));

        Map<String, Object> result = ledgerService.refundDeposit(50L, "Xe lỗi ngoại quan");

        assertEquals("REFUNDED", result.get("status"));
        assertEquals("AVAILABLE", result.get("vehicleStatus"));
        verify(mockVehRepo, times(1)).updateVehicleStatus(1L, "AVAILABLE");
        verify(mockLedgerRepo, times(1)).save(any(TransactionLedger.class));
    }
}
