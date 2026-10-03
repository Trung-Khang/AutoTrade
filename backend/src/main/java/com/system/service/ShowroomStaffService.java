package com.system.service;

import com.system.dto.StaffAvailabilityDto;
import com.system.entity.AppUser;
import com.system.entity.Role;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.AppUserRepository;
import com.system.repository.AppointmentRepository;
import com.system.repository.ShowroomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class ShowroomStaffService {
    private static final Set<String> ACTIVE_APPOINTMENT_STATUSES = Set.of("PENDING", "SCHEDULED");

    private final ShowroomRepository showroomRepository;
    private final AppUserRepository appUserRepository;
    private final AppointmentRepository appointmentRepository;

    public ShowroomStaffService(ShowroomRepository showroomRepository,
                                AppUserRepository appUserRepository,
                                AppointmentRepository appointmentRepository) {
        this.showroomRepository = showroomRepository;
        this.appUserRepository = appUserRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public List<StaffAvailabilityDto> getStaff(Long showroomId, LocalDateTime appointmentDate) {
        if (!showroomRepository.existsById(showroomId)) {
            throw new ResourceNotFoundException("Không tìm thấy showroom với ID: " + showroomId);
        }

        return appUserRepository.findByShowroomIdAndRoleAndActiveTrueAndLockedFalse(showroomId, Role.STAFF)
                .stream()
                .map(staff -> toAvailability(staff, appointmentDate))
                .toList();
    }

    private StaffAvailabilityDto toAvailability(AppUser staff, LocalDateTime appointmentDate) {
        boolean available = appointmentDate == null
                || !appointmentRepository.existsByAssignedStaffIdAndAppointmentDateAndStatusIn(
                staff.getId(), appointmentDate, ACTIVE_APPOINTMENT_STATUSES);
        return new StaffAvailabilityDto(staff.getId(), staff.getFullName(), staff.getPhone(),
                staff.getEmail(), available, available ? "Sẵn sàng đón tiếp" : "Đã kín lịch");
    }
}
