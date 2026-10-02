package com.system.service;

import com.system.dto.request.LoginRequest;
import com.system.dto.request.RegisterRequest;
import com.system.dto.request.ResetPasswordRequest;
import com.system.dto.response.AuthResponse;
import com.system.dto.response.CurrentUserResponse;
import com.system.dto.response.MessageResponse;
import com.system.dto.response.ResetVerificationResponse;
import com.system.entity.*;
import com.system.exception.AuthException;
import com.system.repository.AppUserRepository;
import com.system.repository.PasswordResetSessionRepository;
import com.system.security.JwtTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String GENERIC_FORGOT_MESSAGE = "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.";
    private final AppUserRepository userRepository;
    private final PasswordResetSessionRepository resetSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final JwtTokenService jwtTokenService;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final long resetSessionMinutes;

    public AuthService(AppUserRepository userRepository, PasswordResetSessionRepository resetSessionRepository,
                       PasswordEncoder passwordEncoder, OtpService otpService, JwtTokenService jwtTokenService,
                       PasswordPolicyValidator passwordPolicyValidator,
                       @Value("${app.security.reset-session-minutes}") long resetSessionMinutes) {
        this.userRepository = userRepository;
        this.resetSessionRepository = resetSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.jwtTokenService = jwtTokenService;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.resetSessionMinutes = resetSessionMinutes;
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String phone = normalizePhone(request == null ? null : request.phone());
        validateRegistration(request, phone);
        String username = request.username().trim();
        String email = normalizeEmail(request.email());
        AppUser existingByEmail = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existingByEmail != null) {
            if (existingByEmail.isEmailVerified()) {
                throw new AuthException(HttpStatus.CONFLICT, "Email đã được sử dụng.");
            }
            OtpService.OtpDispatch dispatch = otpService.issue(existingByEmail, OtpPurpose.VERIFY_EMAIL, true);
            return verificationDispatchMessage(dispatch);
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new AuthException(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng.");
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.CUSTOMER);
        user.setActive(true);
        user.setEmailVerified(false);
        user.setLocked(false);
        userRepository.saveAndFlush(user);

        OtpService.OtpDispatch dispatch = otpService.issue(user, OtpPurpose.VERIFY_EMAIL, false);
        return verificationDispatchMessage(dispatch);
    }

    @Transactional
    public MessageResponse resendVerification(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "Không thể gửi mã xác minh cho email này."));
        if (user.isEmailVerified()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Tài khoản này đã được xác minh email.");
        }
        return verificationDispatchMessage(otpService.issue(user, OtpPurpose.VERIFY_EMAIL, true));
    }

    @Transactional(noRollbackFor = AuthException.class)
    public MessageResponse verifyEmail(String email, String code) {
        AppUser user = otpService.verify(email, requireOtp(code), OtpPurpose.VERIFY_EMAIL);
        if (user.isEmailVerified()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Tài khoản này đã được xác minh email.");
        }
        user.setEmailVerified(true);
        return new MessageResponse("Xác minh tài khoản thành công. Bạn có thể đăng nhập.", true, 0L);
    }

    public AuthResponse login(LoginRequest request) {
        if (request == null || isBlank(request.usernameOrEmail()) || isBlank(request.password())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Vui lòng nhập tên đăng nhập/email và mật khẩu.");
        }
        String identity = request.usernameOrEmail().trim();
        AppUser user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identity, normalizeEmail(identity))
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "Tên đăng nhập/email hoặc mật khẩu không đúng."));
        if (!user.isActive()) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }
        if (user.isLocked()) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Tên đăng nhập/email hoặc mật khẩu không đúng.");
        }
        if (!user.isEmailVerified()) {
            throw new AuthException(HttpStatus.FORBIDDEN,
                    "Tài khoản chưa xác minh email. Vui lòng xác minh hoặc gửi lại mã OTP.");
        }
        return toAuthResponse(user, jwtTokenService.generate(user));
    }

    @Transactional
    public MessageResponse requestPasswordReset(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(email)).orElse(null);
        if (user != null && user.isActive() && !user.isLocked() && user.isEmailVerified()) {
            try {
                otpService.issue(user, OtpPurpose.RESET_PASSWORD, true);
            } catch (AuthException ignored) {
                // Preserve the generic response to avoid account enumeration and timing detail leakage.
            }
        }
        return new MessageResponse(GENERIC_FORGOT_MESSAGE, true, 0L);
    }

    @Transactional
    public MessageResponse requestPasswordResetByUsername(String username) {
        String normalizedUsername = username == null ? "" : username.trim();
        AppUser user = userRepository.findByUsernameIgnoreCase(normalizedUsername).orElse(null);
        if (user == null || !user.isActive() || user.isLocked() || !user.isEmailVerified()) {
            return new MessageResponse(GENERIC_FORGOT_MESSAGE, true, 0L);
        }
        OtpService.OtpDispatch dispatch = otpService.issue(user, OtpPurpose.RESET_PASSWORD, true);
        String message = dispatch.emailSent()
                ? "Mã xác thực đã được gửi tới email " + maskEmail(user.getEmail()) + ". Vui lòng kiểm tra Hộp thư đến và Spam."
                : "Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.";
        return new MessageResponse(message, dispatch.emailSent(), dispatch.retryAfterSeconds());
    }

    @Transactional(noRollbackFor = AuthException.class)
    public ResetVerificationResponse verifyPasswordResetOtp(String email, String code) {
        AppUser user = otpService.verify(email, requireOtp(code), OtpPurpose.RESET_PASSWORD);
        if (!user.isActive() || user.isLocked()) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Không thể đặt lại mật khẩu cho tài khoản này.");
        }
        byte[] rawToken = new byte[32];
        RANDOM.nextBytes(rawToken);
        String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken);
        List<PasswordResetSession> previousSessions = resetSessionRepository.findByUserIdAndConsumedAtIsNull(user.getId());
        Instant now = Instant.now();
        previousSessions.forEach(session -> session.setConsumedAt(now));
        resetSessionRepository.saveAll(previousSessions);
        PasswordResetSession session = new PasswordResetSession();
        session.setUser(user);
        session.setTokenHash(OtpService.sha256(resetToken));
        session.setExpiresAt(now.plusSeconds(resetSessionMinutes * 60));
        resetSessionRepository.save(session);
        return new ResetVerificationResponse("Mã OTP hợp lệ. Vui lòng đặt mật khẩu mới.", resetToken);
    }

    @Transactional(noRollbackFor = AuthException.class)
    public ResetVerificationResponse verifyPasswordResetOtpByUsername(String username, String code) {
        String normalizedUsername = username == null ? "" : username.trim();
        AppUser user = userRepository.findByUsernameIgnoreCase(normalizedUsername)
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn."));
        return verifyPasswordResetOtp(user.getEmail(), code);
    }

    private String maskEmail(String email) {
        int at = email == null ? -1 : email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        String local = email.substring(0, at);
        String visible = local.substring(0, Math.min(2, local.length()));
        return visible + "***" + email.substring(at);
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        if (request == null || isBlank(request.resetToken())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
        PasswordResetSession session = resetSessionRepository
                .findByTokenHashAndConsumedAtIsNull(OtpService.sha256(request.resetToken()))
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."));
        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
        AppUser user = session.getUser();
        passwordPolicyValidator.validate(request.newPassword(), request.confirmPassword(), user.getUsername(), user.getEmail());
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải khác mật khẩu hiện tại.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        session.setConsumedAt(Instant.now());
        return new MessageResponse("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.", true, 0L);
    }

    public CurrentUserResponse currentUser(AppUser user) {
        return new CurrentUserResponse(user.getId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole().name());
    }

    private AuthResponse toAuthResponse(AppUser user, String token) {
        return new AuthResponse(user.getId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole().name(), token);
    }

    private MessageResponse verificationDispatchMessage(OtpService.OtpDispatch dispatch) {
        String message = dispatch.emailSent()
                ? "Máy chủ email đã chấp nhận gửi mã xác nhận. Vui lòng kiểm tra Hộp thư đến và Spam."
                : "Chưa thể gửi email. Vui lòng thử gửi lại OTP sau ít phút.";
        return new MessageResponse(message, dispatch.emailSent(), dispatch.retryAfterSeconds());
    }

    private void validateRegistration(RegisterRequest request, String normalizedPhone) {
        if (request == null || isBlank(request.username()) || isBlank(request.fullName()) || isBlank(request.email())
                || isBlank(request.phone()) || isBlank(request.password())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Vui lòng nhập đầy đủ các trường bắt buộc.");
        }
        if (!request.username().trim().matches("[A-Za-z0-9._-]{3,50}")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Tên đăng nhập phải dài 3-50 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        }
        if (request.fullName().trim().length() > 120 || normalizeEmail(request.email()).length() > 254) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Tên hoặc email vượt quá độ dài cho phép.");
        }
        if (!normalizeEmail(request.email()).matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Email không hợp lệ.");
        }
        if (normalizedPhone == null || !normalizedPhone.matches("(03|05|07|08|09)\\d{8}")) {
            throw new AuthException(HttpStatus.BAD_REQUEST,
                    "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.");
        }
        passwordPolicyValidator.validate(request.password(), request.confirmPassword(), request.username(), request.email());
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new AuthException(HttpStatus.CONFLICT, "Số điện thoại đã được sử dụng.");
        }
    }

    private String requireOtp(String code) {
        if (code == null || !code.matches("\\d{6}")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Mã OTP phải gồm 6 chữ số.");
        }
        return code;
    }

    private String normalizeEmail(String email) { return email == null ? "" : email.trim().toLowerCase(Locale.ROOT); }
    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String compact = phone.trim().replaceAll("[\\s().-]", "");
        if (compact.startsWith("+84")) {
            compact = "0" + compact.substring(3);
        }
        return compact;
    }
    private String blankToNull(String value) { return isBlank(value) ? null : value.trim(); }
    private boolean isBlank(String value) { return value == null || value.trim().isEmpty(); }
}
