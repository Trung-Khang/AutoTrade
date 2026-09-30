package com.system.service;

import com.system.entity.AppUser;
import com.system.entity.AuthOtp;
import com.system.entity.OtpPurpose;
import com.system.exception.AuthException;
import com.system.repository.AppUserRepository;
import com.system.repository.AuthOtpRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
public class OtpService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Duration OTP_LIFETIME = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_ATTEMPTS = 5;

    private final AppUserRepository userRepository;
    private final AuthOtpRepository otpRepository;
    private final OtpMailService mailService;

    public OtpService(AppUserRepository userRepository, AuthOtpRepository otpRepository, OtpMailService mailService) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.mailService = mailService;
    }

    @Transactional
    public OtpDispatch issue(AppUser inputUser, OtpPurpose purpose, boolean enforceCooldown) {
        AppUser user = userRepository.findLockedById(inputUser.getId()).orElseThrow();
        Instant now = Instant.now();
        List<AuthOtp> activeOtps = otpRepository.findByUserIdAndPurposeAndConsumedAtIsNullAndInvalidatedAtIsNull(user.getId(), purpose);
        for (AuthOtp active : activeOtps) {
            long waitSeconds = Math.max(0, RESEND_COOLDOWN.minus(Duration.between(active.getLastSentAt(), now)).toSeconds());
            if (enforceCooldown && waitSeconds > 0) {
                throw new AuthException(HttpStatus.TOO_MANY_REQUESTS,
                        "Vui lòng chờ " + waitSeconds + " giây trước khi gửi lại mã OTP.");
            }
            active.setInvalidatedAt(now);
        }
        otpRepository.saveAll(activeOtps);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        AuthOtp otp = new AuthOtp();
        otp.setUser(user);
        otp.setEmail(user.getEmail());
        otp.setPurpose(purpose);
        otp.setCodeHash(sha256(code));
        otp.setExpiresAt(now.plus(OTP_LIFETIME));
        otp.setLastSentAt(now);
        otpRepository.save(otp);

        boolean emailSent = mailService.send(user.getEmail(), user.getFullName(), purpose, code);
        if (!emailSent) {
            otp.setLastSentAt(now.minus(RESEND_COOLDOWN));
        }
        return new OtpDispatch(emailSent, 0L);
    }

    @Transactional
    public AppUser verify(String email, String code, OtpPurpose purpose) {
        AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn."));
        AuthOtp otp = otpRepository.findFirstByUserIdAndPurposeAndConsumedAtIsNullAndInvalidatedAtIsNullOrderByCreatedAtDesc(user.getId(), purpose)
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn."));
        Instant now = Instant.now();
        if (otp.getExpiresAt().isBefore(now) || otp.getAttemptCount() >= MAX_ATTEMPTS) {
            otp.setInvalidatedAt(now);
            throw new AuthException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        if (!MessageDigest.isEqual(otp.getCodeHash().getBytes(StandardCharsets.UTF_8), sha256(code).getBytes(StandardCharsets.UTF_8))) {
            int attempts = otp.getAttemptCount() + 1;
            otp.setAttemptCount(attempts);
            if (attempts >= MAX_ATTEMPTS) {
                otp.setInvalidatedAt(now);
            }
            throw new AuthException(HttpStatus.BAD_REQUEST, "Mã OTP không hợp lệ hoặc đã hết hạn.");
        }
        otp.setConsumedAt(now);
        return user;
    }

    public static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public record OtpDispatch(boolean emailSent, Long retryAfterSeconds) { }
}
