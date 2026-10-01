package com.system.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.system.dto.request.LoginRequest;
import com.system.dto.request.ResetPasswordRequest;
import com.system.entity.*;
import com.system.exception.AuthException;
import com.system.repository.AppUserRepository;
import com.system.repository.AuthOtpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real PostgreSQL/transaction regressions with private fixtures. NO mail delivery simulation. */
@SpringBootTest
@AutoConfigureMockMvc
class AuthDatabaseIntegrationTest {
    @Autowired AuthService auth;
    @Autowired AppUserRepository users;
    @Autowired AuthOtpRepository otps;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    AppUser user;
    String password;
    String code;

    @BeforeEach void isolatedFixture() {
        assertTrue(jdbc.queryForObject("select current_database()", String.class).startsWith("tv3_official_"),
                "Requires database created by official isolated runner");
        password=UUID.randomUUID().toString();
        code=String.format(Locale.ROOT,"%06d",new SecureRandom().nextInt(1_000_000));
        user=new AppUser();
        user.setUsername("reg."+UUID.randomUUID().toString().substring(0,12));
        user.setEmail(user.getUsername()+"@example.test");
        user.setFullName("Private regression fixture");
        user.setPasswordHash(encoder.encode(password));
        user=users.saveAndFlush(user);
    }
    AuthOtp fixture(OtpPurpose purpose, Instant expiry) {
        AuthOtp otp=new AuthOtp(); otp.setUser(user); otp.setEmail(user.getEmail());
        otp.setPurpose(purpose); otp.setCodeHash(OtpService.sha256(code)); otp.setExpiresAt(expiry);
        return otps.saveAndFlush(otp);
    }
    AuthOtp stored(AuthOtp otp) { return otps.findById(otp.getId()).orElseThrow(); }
    void verified() { user.setEmailVerified(true); user=users.saveAndFlush(user); }

    @Test void wrongAttemptsPersistAndInvalidateAtFiveAcrossRealTransactions() {
        AuthOtp otp=fixture(OtpPurpose.VERIFY_EMAIL, Instant.now().plusSeconds(300));
        String wrong=code.equals("000000")?"000001":"000000";
        for (int i=1;i<=5;i++) {
            assertThrows(AuthException.class,()->auth.verifyEmail(user.getEmail(),wrong));
            assertEquals(i,stored(otp).getAttemptCount());
        }
        assertNotNull(stored(otp).getInvalidatedAt());
        assertThrows(AuthException.class,()->auth.verifyEmail(user.getEmail(),code));
        assertFalse(users.findById(user.getId()).orElseThrow().isEmailVerified());
    }
    @Test void expiredOtpPersistsInvalidation() {
        AuthOtp otp=fixture(OtpPurpose.VERIFY_EMAIL, Instant.now().minusSeconds(1));
        assertThrows(AuthException.class,()->auth.verifyEmail(user.getEmail(),code));
        assertNotNull(stored(otp).getInvalidatedAt());
        assertFalse(users.findById(user.getId()).orElseThrow().isEmailVerified());
    }
    @Test void cooldownRejectsResendAndPreservesCurrentOtp() {
        AuthOtp otp=fixture(OtpPurpose.VERIFY_EMAIL, Instant.now().plusSeconds(300));
        AuthException error=assertThrows(AuthException.class,()->auth.resendVerification(user.getEmail()));
        assertEquals(429,error.getStatus().value());
        assertNull(stored(otp).getInvalidatedAt());
    }
    @Test void verifiedLoginAndMeUseActualDatabaseIdentityAndOtpIsSingleUse() throws Exception {
        fixture(OtpPurpose.VERIFY_EMAIL, Instant.now().plusSeconds(300));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new LoginRequest(user.getEmail(),password))))
                .andExpect(status().isForbidden());
        auth.verifyEmail(user.getEmail(),code);
        assertTrue(users.findById(user.getId()).orElseThrow().isEmailVerified());
        assertThrows(AuthException.class,()->auth.verifyEmail(user.getEmail(),code));
        String body=mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new LoginRequest(user.getUsername().toUpperCase(Locale.ROOT),password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String token=json.readTree(body).get("token").asText();
        mvc.perform(get("/api/v1/auth/me").header("Authorization","Bearer "+token))
                .andExpect(status().isOk()).andExpect(jsonPath("id").value(user.getId()))
                .andExpect(jsonPath("username").value(user.getUsername())).andExpect(jsonPath("email").value(user.getEmail()));
    }
    @Test void simultaneousVerificationOnlyOneConsumesOtp() throws Exception {
        AuthOtp otp=fixture(OtpPurpose.VERIFY_EMAIL, Instant.now().plusSeconds(300));
        ExecutorService pool=Executors.newFixedThreadPool(2);
        CountDownLatch go=new CountDownLatch(1);
        Callable<Boolean> task=()->{ go.await(); try {auth.verifyEmail(user.getEmail(),code); return true;}
            catch (AuthException ex) {return false;} };
        try {
            Future<Boolean> a=pool.submit(task),b=pool.submit(task); go.countDown();
            assertNotEquals(a.get(20,TimeUnit.SECONDS),b.get(20,TimeUnit.SECONDS));
            assertNotNull(stored(otp).getConsumedAt());
        } finally {pool.shutdownNow();}
    }
    @Test void resetWrongAttemptsPersistAndResetTokenCannotBeReused() {
        verified(); AuthOtp otp=fixture(OtpPurpose.RESET_PASSWORD, Instant.now().plusSeconds(300));
        String wrong=code.equals("000000")?"000001":"000000";
        assertThrows(AuthException.class,()->auth.verifyPasswordResetOtp(user.getEmail(),wrong));
        assertEquals(1,stored(otp).getAttemptCount());
        String token=auth.verifyPasswordResetOtp(user.getEmail(),code).resetToken();
        assertThrows(AuthException.class,()->auth.verifyPasswordResetOtp(user.getEmail(),code));
        String next=UUID.randomUUID().toString();
        auth.resetPassword(new ResetPasswordRequest(token,next,next));
        assertThrows(AuthException.class,()->auth.resetPassword(new ResetPasswordRequest(token,password,password)));
        assertThrows(AuthException.class,()->auth.login(new LoginRequest(user.getEmail(),password)));
        assertEquals(user.getId(),auth.login(new LoginRequest(user.getEmail(),next)).userId());
        assertTrue(users.findById(user.getId()).orElseThrow().getPasswordHash().startsWith("$2a$12$"));
    }
    @Test void concurrentRegistrationConflictReturns409WithoutLeakingDatabaseDetails() throws Exception {
        String name="race."+UUID.randomUUID().toString().substring(0,12);
        ExecutorService pool=Executors.newFixedThreadPool(2);
        CountDownLatch go=new CountDownLatch(1);
        Callable<Integer> first=()->{go.await(); return registerStatus(name,name+".one@example.test");};
        Callable<Integer> second=()->{go.await(); return registerStatus(name.toUpperCase(Locale.ROOT),name+".two@example.test");};
        try {
            Future<Integer> a=pool.submit(first),b=pool.submit(second);go.countDown();
            Set<Integer> statuses=Set.of(a.get(30,TimeUnit.SECONDS),b.get(30,TimeUnit.SECONDS));
            assertEquals(Set.of(200,409),statuses);
        } finally {pool.shutdownNow();}
    }
    int registerStatus(String name,String email) throws Exception {
        String body=json.writeValueAsString(Map.of("username",name,"email",email,"fullName","Race fixture",
                "phone","0123456789","password",password));
        var response=mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andReturn().getResponse();
        assertFalse(response.getContentAsString().contains("password_hash"));
        assertFalse(response.getContentAsString().contains("app_users_"));
        return response.getStatus();
    }
    @Test void forgotPasswordCooldownKeepsGenericResponseWithoutRollbackOnlyFailure() {
        verified(); AuthOtp otp=fixture(OtpPurpose.RESET_PASSWORD, Instant.now().plusSeconds(300));
        assertDoesNotThrow(()->auth.requestPasswordReset(user.getEmail()));
        assertNull(stored(otp).getInvalidatedAt());
    }
    @Test void expiredResetOtpPersistsInvalidation() {
        verified(); AuthOtp otp=fixture(OtpPurpose.RESET_PASSWORD, Instant.now().minusSeconds(1));
        assertThrows(AuthException.class,()->auth.verifyPasswordResetOtp(user.getEmail(),code));
        assertNotNull(stored(otp).getInvalidatedAt());
    }
    @Test void lockedAndInactiveAccountsCannotLogin() {
        verified(); user.setLocked(true); users.saveAndFlush(user);
        assertEquals(403,assertThrows(AuthException.class,()->auth.login(new LoginRequest(user.getEmail(),password))).getStatus().value());
        user.setLocked(false); user.setActive(false); users.saveAndFlush(user);
        assertEquals(403,assertThrows(AuthException.class,()->auth.login(new LoginRequest(user.getEmail(),password))).getStatus().value());
    }
}
