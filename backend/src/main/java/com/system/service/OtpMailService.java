package com.system.service;

import com.system.entity.OtpPurpose;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.SocketTimeoutException;

@Service
public class OtpMailService {
    private static final Logger LOGGER = LoggerFactory.getLogger(OtpMailService.class);
    private static final int MAX_SEND_ATTEMPTS = 2;
    private final JavaMailSender mailSender;
    private final String username;
    private final String password;
    private final String from;
    private final String fromName;

    public OtpMailService(JavaMailSender mailSender,
                          @Value("${spring.mail.username}") String username,
                          @Value("${spring.mail.password}") String password,
                          @Value("${app.mail.from}") String from,
                          @Value("${app.mail.from-name}") String fromName) {
        this.mailSender = mailSender;
        this.username = username;
        this.password = password;
        this.from = from;
        this.fromName = fromName;
    }

    public boolean send(String toEmail, String fullName, OtpPurpose purpose, String code) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password) || !StringUtils.hasText(from)) {
            LOGGER.warn("OTP email delivery skipped because SMTP is not configured.");
            return false;
        }
        String subject = purpose == OtpPurpose.VERIFY_EMAIL
                ? "[AUTOTRADE] Mã xác nhận tạo tài khoản"
                : "[AUTOTRADE] Mã xác nhận đặt lại mật khẩu";
        String action = purpose == OtpPurpose.VERIFY_EMAIL ? "xác nhận tạo tài khoản" : "đặt lại mật khẩu";
        String plainBody = """
                AutoTrade

                Xin chào %s,

                Đây là mã %s của bạn: %s

                Mã có hiệu lực trong 5 phút và chỉ dùng một lần.
                Không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu, hãy bỏ qua email này.
                """.formatted(fullName, action, code);
        for (int attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
            try {
                sendOnce(toEmail, plainBody, subject);
                if (attempt > 1) {
                    LOGGER.info("OTP email delivery recovered on retry {}.", attempt);
                }
                return true;
            } catch (Exception ex) {
                if (attempt < MAX_SEND_ATTEMPTS && isSocketTimeout(ex)) {
                    LOGGER.warn("OTP SMTP response timed out; retrying once.");
                    continue;
                }
                logDeliveryFailure(ex, toEmail);
                return false;
            }
        }
        return false;
    }

    private void sendOnce(String toEmail, String plainBody, String subject) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
        helper.setFrom(from, fromName);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(plainBody, false);
        mailSender.send(message);
    }

    private boolean isSocketTimeout(Throwable error) {
        Throwable cause = error;
        while (cause != null) {
            if (cause instanceof SocketTimeoutException) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    private void logDeliveryFailure(Exception error, String toEmail) {
        Throwable cause = error;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        String detail = cause.getMessage() == null ? "no SMTP detail" : cause.getMessage();
        for (String sensitiveValue : new String[]{username, password, from, toEmail}) {
            if (StringUtils.hasText(sensitiveValue)) {
                detail = detail.replace(sensitiveValue, "[redacted]");
            }
        }
        LOGGER.warn("OTP email delivery failed ({}): {}", cause.getClass().getSimpleName(), detail);
    }
}
