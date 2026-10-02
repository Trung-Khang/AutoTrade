package com.system.service;

import com.system.dto.PageResponse;
import com.system.dto.UserSummaryResponse;
import com.system.entity.AppUser;
import com.system.entity.Role;
import com.system.exception.AuthException;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.AppUserRepository;
import com.system.security.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminUserService {

    private final AppUserRepository userRepository;
    private final com.system.repository.DepositRepository depositRepository;
    private final com.system.repository.AppointmentRepository appointmentRepository;

    public AdminUserService(AppUserRepository userRepository,
                            com.system.repository.DepositRepository depositRepository,
                            com.system.repository.AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.depositRepository = depositRepository;
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * Lấy danh sách tài khoản kèm bộ lọc tìm kiếm, vai trò, trạng thái khóa và phân trang
     */
    @Transactional(readOnly = true)
    public PageResponse<UserSummaryResponse> getUsers(String keyword, String role, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        Specification<AppUser> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Tìm kiếm theo từ khóa (username, fullName, email, phone)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                Predicate usernamePred = cb.like(cb.lower(root.get("username")), kw);
                Predicate fullNamePred = cb.like(cb.lower(root.get("fullName")), kw);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), kw);
                Predicate phonePred = cb.like(cb.lower(root.get("phone")), kw);
                predicates.add(cb.or(usernamePred, fullNamePred, emailPred, phonePred));
            }

            // 2. Lọc theo vai trò (Role)
            if (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role.trim())) {
                try {
                    Role roleEnum = Role.valueOf(role.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("role"), roleEnum));
                } catch (IllegalArgumentException ignored) {
                }
            }

            // 3. Lọc theo trạng thái (status: ACTIVE / LOCKED)
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
                if ("LOCKED".equalsIgnoreCase(status.trim())) {
                    predicates.add(cb.isTrue(root.get("locked")));
                } else if ("ACTIVE".equalsIgnoreCase(status.trim())) {
                    predicates.add(cb.and(cb.isFalse(root.get("locked")), cb.isTrue(root.get("active"))));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AppUser> userPage = userRepository.findAll(spec, pageable);
        List<UserSummaryResponse> dtoList = userPage.getContent().stream()
                .map(UserSummaryResponse::fromEntity)
                .toList();

        return new PageResponse<>(
                dtoList,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isFirst(),
                userPage.isLast()
        );
    }

    /**
     * Khóa hoặc Mở khóa tài khoản
     */
    @Transactional
    public UserSummaryResponse updateUserStatus(Long targetUserId, boolean locked) {
        Long currentUserId = SecurityUtils.currentUser().id();

        // Không cho phép Admin tự khóa tài khoản của chính mình
        if (targetUserId.equals(currentUserId) && locked) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Không thể tự khóa tài khoản quản trị đang đăng nhập.");
        }

        AppUser targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + targetUserId));

        targetUser.setLocked(locked);
        targetUser = userRepository.save(targetUser);

        return UserSummaryResponse.fromEntity(targetUser);
    }

    /**
     * Đổi vai trò (CUSTOMER <-> STAFF <-> ADMIN)
     */
    @Transactional
    public UserSummaryResponse updateUserRole(Long targetUserId, String newRoleStr) {
        if (newRoleStr == null || newRoleStr.trim().isEmpty()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Vai trò mới không được để trống.");
        }

        Role newRole;
        try {
            newRole = Role.valueOf(newRoleStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ. Phải là CUSTOMER, STAFF hoặc ADMIN.");
        }

        Long currentUserId = SecurityUtils.currentUser().id();

        // Không cho phép Admin tự hạ quyền quản trị của chính mình
        if (targetUserId.equals(currentUserId) && newRole != Role.ADMIN) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Không thể tự hạ quyền quản trị của chính mình.");
        }

        AppUser targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + targetUserId));

        targetUser.setRole(newRole);
        targetUser = userRepository.save(targetUser);

        return UserSummaryResponse.fromEntity(targetUser);
    }

    /**
     * Xóa tài khoản người dùng
     * Ràng buộc nghiệp vụ:
     * 1. Không cho phép Admin tự xóa tài khoản của chính mình.
     * 2. Chỉ được phép xóa tài khoản khi người dùng KHÔNG CÓ lịch hẹn và KHÔNG CÓ đơn đặt cọc.
     */
    @Transactional
    public java.util.Map<String, Object> deleteUser(Long targetUserId) {
        Long currentUserId = SecurityUtils.currentUser().id();

        // 1. Chặn Admin tự xóa chính mình
        if (targetUserId.equals(currentUserId)) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Không thể tự xóa tài khoản quản trị đang đăng nhập.");
        }

        // 2. Tìm tài khoản cần xóa
        AppUser targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với ID: " + targetUserId));

        // 3. Ràng buộc: Kiểm tra đơn cọc và lịch hẹn
        boolean hasDeposits = depositRepository.existsByUserId(targetUserId);
        boolean hasAppointments = appointmentRepository.existsByUserId(targetUserId);

        if (hasDeposits || hasAppointments) {
            throw new AuthException(HttpStatus.BAD_REQUEST,
                    "Không thể xóa tài khoản này vì người dùng đang có lịch hẹn hoặc đơn đặt cọc trên hệ thống. Bạn có thể sử dụng chức năng Khóa tài khoản thay thế.");
        }

        // 4. Tiến hành xóa
        userRepository.delete(targetUser);

        return java.util.Map.of(
                "success", true,
                "message", "Đã xóa tài khoản @" + targetUser.getUsername() + " thành công.",
                "deletedUserId", targetUserId
        );
    }
}
