package com.system.controller;

import com.system.dto.request.*;
import com.system.dto.response.*;
import com.system.entity.Role;
import com.system.exception.AuthException;
import com.system.security.AppUserPrincipal;
import com.system.security.SecurityUtils;
import com.system.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication API", description = "Đăng ký, xác minh email OTP, đăng nhập và đặt lại mật khẩu của AutoTrade")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký CUSTOMER và gửi OTP xác minh")
    public ResponseEntity<MessageResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Xác minh OTP khi đăng ký")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestBody OtpVerificationRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request.email(), request.code()));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Gửi lại OTP xác minh email, có cooldown 60 giây")
    public ResponseEntity<MessageResponse> resendVerification(@RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.resendVerification(request.email()));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng username hoặc email")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất JWT phía client")
    public ResponseEntity<MessageResponse> logout() {
        return ResponseEntity.ok(new MessageResponse("Đăng xuất thành công.", true, 0L));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu OTP đặt lại mật khẩu, không tiết lộ email tồn tại")
    public ResponseEntity<MessageResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.requestPasswordResetByUsername(request.username()));
    }

    @PostMapping("/verify-reset-otp")
    @Operation(summary = "Xác minh OTP quên mật khẩu và cấp reset token ngắn hạn")
    public ResponseEntity<ResetVerificationResponse> verifyResetOtp(@RequestBody ResetOtpVerificationRequest request) {
        return ResponseEntity.ok(authService.verifyPasswordResetOtpByUsername(request.username(), request.code()));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt mật khẩu mới bằng reset token đã xác minh")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy current user từ JWT")
    public ResponseEntity<CurrentUserResponse> currentUser() {
        AppUserPrincipal principal = SecurityUtils.currentUser();
        return ResponseEntity.ok(new CurrentUserResponse(principal.id(), principal.username(), principal.fullName(),
                principal.email(), principal.phone(), principal.role().name(), principal.showroomId()));
    }

    @PatchMapping("/me")
    @Operation(summary = "Cập nhật họ tên và số điện thoại của tài khoản hiện tại")
    public ResponseEntity<CurrentUserResponse> updateProfile(@RequestBody UpdateProfileRequest request) {
        AppUserPrincipal principal = SecurityUtils.currentUser();
        if (principal.role() != Role.CUSTOMER) {
            throw new AuthException(org.springframework.http.HttpStatus.FORBIDDEN,
                    "Chỉ CUSTOMER được cập nhật thông tin cá nhân tại đây.");
        }
        return ResponseEntity.ok(authService.updateCurrentUser(request, principal.id()));
    }
}
