package com.system.service;

import com.system.dto.PageResponse;
import com.system.dto.UserSummaryResponse;
import com.system.entity.AppUser;
import com.system.entity.Role;
import com.system.exception.AuthException;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.AppUserRepository;
import com.system.security.AppUserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceUnitTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private com.system.repository.DepositRepository depositRepository;

    @Mock
    private com.system.repository.AppointmentRepository appointmentRepository;

    @Mock
    private com.system.repository.ShowroomRepository showroomRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    private AppUser adminUser;
    private AppUser customerUser;

    @BeforeEach
    void setUp() {
        adminUser = new AppUser();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@autotrade.vn");
        adminUser.setFullName("Admin Root");
        adminUser.setRole(Role.ADMIN);
        adminUser.setActive(true);
        adminUser.setLocked(false);

        // Reflection set ID
        try {
            var idField = AppUser.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(adminUser, 1L);
        } catch (Exception ignored) {}

        customerUser = new AppUser();
        customerUser.setUsername("customer");
        customerUser.setEmail("customer@autotrade.vn");
        customerUser.setFullName("Nguyen Van A");
        customerUser.setRole(Role.CUSTOMER);
        customerUser.setActive(true);
        customerUser.setLocked(false);

        try {
            var idField = AppUser.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(customerUser, 2L);
        } catch (Exception ignored) {}

        // Mock current authenticated user as admin (ID 1)
        AppUserPrincipal principal = AppUserPrincipal.from(adminUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Lấy danh sách người dùng thành công")
    void testGetUsers_Success() {
        Page<AppUser> page = new PageImpl<>(List.of(adminUser, customerUser));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResponse<UserSummaryResponse> res = adminUserService.getUsers("", "ALL", "ALL", 0, 10);

        assertNotNull(res);
        assertEquals(2, res.getContent().size());
        assertEquals("admin", res.getContent().get(0).getUsername());
        assertEquals("customer", res.getContent().get(1).getUsername());
    }

    @Test
    @DisplayName("Khóa tài khoản người dùng thành công")
    void testUpdateUserStatus_LockCustomer_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserSummaryResponse res = adminUserService.updateUserStatus(2L, true);

        assertNotNull(res);
        assertTrue(res.isLocked());
        verify(userRepository, times(1)).save(customerUser);
    }

    @Test
    @DisplayName("Admin không thể tự khóa tài khoản của chính mình")
    void testUpdateUserStatus_AdminSelfLock_ThrowsException() {
        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.updateUserStatus(1L, true));

        assertTrue(ex.getMessage().contains("Không thể tự khóa tài khoản quản trị"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật vai trò người dùng thành công")
    void testUpdateUserRole_PromoteToStaff_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(showroomRepository.existsById(2L)).thenReturn(true);
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserSummaryResponse res = adminUserService.updateUserRole(2L, "STAFF", 2L);

        assertNotNull(res);
        assertEquals("STAFF", res.getRole());
        assertEquals(2L, res.getShowroomId());
        verify(userRepository, times(1)).save(customerUser);
    }

    @Test
    @DisplayName("Không cho chuyển sang STAFF nếu thiếu showroom")
    void testUpdateUserRole_StaffWithoutShowroom_ThrowsException() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));

        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.updateUserRole(2L, "STAFF", null));

        assertTrue(ex.getMessage().contains("bắt buộc phải thuộc một showroom"));
        verify(userRepository, never()).save(any(AppUser.class));
    }

    @Test
    @DisplayName("Không cho đổi chi nhánh Staff đang có lịch hiệu lực")
    void testUpdateUserRole_ActiveStaffAppointment_ThrowsException() {
        AppUser staff = customerUser;
        staff.setRole(Role.STAFF);
        staff.setShowroomId(1L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(showroomRepository.existsById(2L)).thenReturn(true);
        when(appointmentRepository.existsByAssignedStaffIdAndStatusIn(
                2L, java.util.Set.of("PENDING", "SCHEDULED"))).thenReturn(true);

        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.updateUserRole(2L, "STAFF", 2L));

        assertTrue(ex.getMessage().contains("lịch hẹn hiệu lực"));
        verify(userRepository, never()).save(any(AppUser.class));
    }

    @Test
    @DisplayName("Admin không thể tự hạ quyền của chính mình")
    void testUpdateUserRole_AdminSelfDemote_ThrowsException() {
        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.updateUserRole(1L, "CUSTOMER", null));

        assertTrue(ex.getMessage().contains("Không thể tự hạ quyền quản trị"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật vai trò với giá trị không hợp lệ sẽ báo lỗi")
    void testUpdateUserRole_InvalidRole_ThrowsException() {
        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.updateUserRole(2L, "SUPER_GOD_ROLE", null));

        assertTrue(ex.getMessage().contains("Vai trò không hợp lệ"));
    }

    @Test
    @DisplayName("Cập nhật người dùng không tồn tại sẽ báo lỗi 404")
    void testUpdateUserStatus_NotFound_ThrowsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                adminUserService.updateUserStatus(999L, true));
    }

    @Test
    @DisplayName("Xóa tài khoản thành công khi không có đơn cọc và lịch hẹn")
    void testDeleteUser_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(depositRepository.existsByUserId(2L)).thenReturn(false);
        when(appointmentRepository.existsByUserId(2L)).thenReturn(false);

        var result = adminUserService.deleteUser(2L);

        assertNotNull(result);
        assertEquals(true, result.get("success"));
        verify(userRepository, times(1)).delete(customerUser);
    }

    @Test
    @DisplayName("Chặn xóa tài khoản khi người dùng đang có đơn đặt cọc")
    void testDeleteUser_HasDeposits_ThrowsException() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(depositRepository.existsByUserId(2L)).thenReturn(true);

        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.deleteUser(2L));

        assertTrue(ex.getMessage().contains("đang có lịch hẹn hoặc đơn đặt cọc"));
        verify(userRepository, never()).delete(any(AppUser.class));
    }

    @Test
    @DisplayName("Chặn xóa tài khoản khi người dùng đang có lịch hẹn")
    void testDeleteUser_HasAppointments_ThrowsException() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customerUser));
        when(depositRepository.existsByUserId(2L)).thenReturn(false);
        when(appointmentRepository.existsByUserId(2L)).thenReturn(true);

        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.deleteUser(2L));

        assertTrue(ex.getMessage().contains("đang có lịch hẹn hoặc đơn đặt cọc"));
        verify(userRepository, never()).delete(any(AppUser.class));
    }

    @Test
    @DisplayName("Admin không thể tự xóa tài khoản của chính mình")
    void testDeleteUser_AdminSelfDelete_ThrowsException() {
        AuthException ex = assertThrows(AuthException.class, () ->
                adminUserService.deleteUser(1L));

        assertTrue(ex.getMessage().contains("Không thể tự xóa tài khoản quản trị"));
        verify(userRepository, never()).delete(any(AppUser.class));
    }
}

