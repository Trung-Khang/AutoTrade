package com.system.controller;

import com.system.dto.PageResponse;
import com.system.dto.UserSummaryResponse;
import com.system.dto.request.UpdateProfileRequest;
import com.system.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "3. Admin User API", description = "Các API quản lý tài khoản người dùng, phân quyền RBAC và khóa/mở khóa tài khoản cho Quản trị viên")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * 1. Lấy danh sách tài khoản kèm bộ lọc tìm kiếm, vai trò, trạng thái khóa và phân trang
     * Endpoint: GET /api/v1/admin/users
     */
    @GetMapping
    @Operation(summary = "Danh sách tài khoản người dùng",
               description = "Tìm kiếm theo từ khóa (username, tên, email, sđt), lọc theo vai trò (CUSTOMER, STAFF, ADMIN), trạng thái (ACTIVE, LOCKED) và phân trang.")
    public ResponseEntity<PageResponse<UserSummaryResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<UserSummaryResponse> response = adminUserService.getUsers(keyword, role, status, page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * 2. Khóa hoặc Mở khóa tài khoản
     * Endpoint: PATCH /api/v1/admin/users/{id}/status
     */
    @PatchMapping("/{id}/status")
    @Operation(summary = "Khóa hoặc Mở khóa tài khoản người dùng",
               description = "Cập nhật cờ locked (true/false). Không cho phép Admin tự khóa tài khoản của chính mình.")
    public ResponseEntity<UserSummaryResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean locked,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean isLocked = false;
        if (locked != null) {
            isLocked = locked;
        } else if (body != null && body.containsKey("locked")) {
            isLocked = Boolean.parseBoolean(String.valueOf(body.get("locked")));
        }

        UserSummaryResponse response = adminUserService.updateUserStatus(id, isLocked);
        return ResponseEntity.ok(response);
    }

    /**
     * 3. Thay đổi vai trò người dùng (Phân quyền RBAC)
     * Endpoint: PATCH /api/v1/admin/users/{id}/role
     */
    @PatchMapping("/{id}/role")
    @Operation(summary = "Cập nhật vai trò / Phân quyền tài khoản",
               description = "Chuyển đổi vai trò giữa CUSTOMER, STAFF, ADMIN. Không cho phép Admin tự hạ quyền của chính mình.")
    public ResponseEntity<UserSummaryResponse> updateUserRole(
            @PathVariable Long id,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long showroomId,
            @RequestBody(required = false) Map<String, Object> body) {
        String newRole = role;
        if ((newRole == null || newRole.trim().isEmpty()) && body != null && body.containsKey("role")) {
            newRole = String.valueOf(body.get("role"));
        }

        Long newShowroomId = showroomId;
        if (body != null && body.containsKey("showroomId") && body.get("showroomId") != null) {
            try {
                newShowroomId = Long.valueOf(String.valueOf(body.get("showroomId")));
            } catch (NumberFormatException ex) {
                throw new com.system.exception.AuthException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "showroomId không hợp lệ.");
            }
        }

        UserSummaryResponse response = adminUserService.updateUserRole(id, newRole, newShowroomId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/profile")
    @Operation(summary = "Cập nhật họ tên và số điện thoại Customer",
               description = "Admin chỉ được cập nhật họ tên và số điện thoại của tài khoản CUSTOMER.")
    public ResponseEntity<UserSummaryResponse> updateCustomerProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(adminUserService.updateCustomerProfile(id, request));
    }

    /**
     * 4. Xóa tài khoản người dùng
     * Endpoint: DELETE /api/v1/admin/users/{id}
     * Ràng buộc: Chỉ xóa được tài khoản khi tài khoản KHÔNG CÓ lịch hẹn và KHÔNG CÓ đơn đặt cọc.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài khoản người dùng",
               description = "Xóa tài khoản khỏi hệ thống. Chỉ xóa được khi tài khoản không có lịch hẹn hoặc đơn cọc.")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        Map<String, Object> result = adminUserService.deleteUser(id);
        return ResponseEntity.ok(result);
    }
}

