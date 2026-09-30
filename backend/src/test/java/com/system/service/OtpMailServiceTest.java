package com.system.service;

import com.system.entity.OtpPurpose;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.net.SocketTimeoutException;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OtpMailServiceTest {
    @Test
    void registrationOtpUsesPlainTextAndCorrectRecipient() throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(sender.createMimeMessage()).thenReturn(message);
        doAnswer(invocation -> null).when(sender).send(any(MimeMessage.class));

        OtpMailService service = new OtpMailService(sender, "smtp@example.com", "configured",
                "smtp@example.com", "AutoTrade");
        assertTrue(service.send("new-user@example.com", "New User", OtpPurpose.VERIFY_EMAIL, "123456"));

        assertEquals("new-user@example.com", message.getAllRecipients()[0].toString());
        assertEquals("[AUTOTRADE] Mã xác nhận tạo tài khoản", message.getSubject());
        assertTrue(message.getContentType().toLowerCase().startsWith("text/plain"));
        assertTrue(((String) message.getContent()).contains("123456"));
    }

    @Test
    void retriesOnceWhenSmtpResponseTimesOut() {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties())),
                new MimeMessage(Session.getInstance(new Properties())));
        doThrow(new MailSendException("SMTP response timed out", new SocketTimeoutException("Read timed out")))
                .doNothing()
                .when(sender).send(any(MimeMessage.class));

        OtpMailService service = new OtpMailService(sender, "smtp@example.com", "configured",
                "smtp@example.com", "AutoTrade");

        assertTrue(service.send("new-user@example.com", "New User", OtpPurpose.VERIFY_EMAIL, "123456"));
        verify(sender, times(2)).send(any(MimeMessage.class));
    }
}
