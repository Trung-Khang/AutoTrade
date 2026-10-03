package com.system.service;

import com.system.dto.StaffAvailabilityDto;
import com.system.entity.AppUser;
import com.system.entity.Role;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.AppUserRepository;
import com.system.repository.AppointmentRepository;
import com.system.repository.ShowroomRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShowroomStaffServiceTest {
    @Mock
    private ShowroomRepository showroomRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Test
    void returnsOnlyActiveUnlockedStaffAndMarksBusySlots() {
        AppUser staff = new AppUser();
        staff.setShowroomId(2L);
        staff.setRole(Role.STAFF);
        staff.setActive(true);
        staff.setLocked(false);
        staff.setFullName("Staff HCM");
        staff.setPhone("0987654301");
        staff.setEmail("staff@example.test");

        LocalDateTime slot = LocalDateTime.of(2026, 10, 5, 9, 30);
        when(showroomRepository.existsById(2L)).thenReturn(true);
        when(appUserRepository.findByShowroomIdAndRoleAndActiveTrueAndLockedFalse(2L, Role.STAFF))
                .thenReturn(List.of(staff));
        when(appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
                any(), eq(slot), any())).thenReturn(true);

        List<StaffAvailabilityDto> result = new ShowroomStaffService(
                showroomRepository, appUserRepository, appointmentRepository).getStaff(2L, slot);

        assertEquals(1, result.size());
        assertFalse(result.get(0).isAvailable());
        assertEquals("Đã kín lịch", result.get(0).statusText());
    }

    @Test
    void marksStaffAvailableWithoutAppointmentSlot() {
        AppUser staff = new AppUser();
        staff.setRole(Role.STAFF);
        staff.setFullName("Staff HN");
        when(showroomRepository.existsById(1L)).thenReturn(true);
        when(appUserRepository.findByShowroomIdAndRoleAndActiveTrueAndLockedFalse(1L, Role.STAFF))
                .thenReturn(List.of(staff));
        when(appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(any(), any(), any()))
                .thenReturn(false);

        StaffAvailabilityDto result = new ShowroomStaffService(
                showroomRepository, appUserRepository, appointmentRepository)
                .getStaff(1L, LocalDateTime.of(2026, 10, 5, 9, 30)).get(0);

        assertTrue(result.isAvailable());
        assertEquals("Sẵn sàng đón tiếp", result.statusText());
    }

    @Test
    void rejectsUnknownShowroom() {
        when(showroomRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> new ShowroomStaffService(
                showroomRepository, appUserRepository, appointmentRepository).getStaff(999L, null));
    }
}
