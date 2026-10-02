package com.system.controller;

import com.system.repository.AppUserRepository;
import com.system.entity.AppUser;
import com.system.entity.Role;
import com.system.security.JwtAuthenticationFilter;
import com.system.security.JwtTokenService;
import com.system.security.RestAccessDeniedHandler;
import com.system.security.RestAuthenticationEntryPoint;
import com.system.service.DepositService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

@WebMvcTest(DepositController.class)
@Import({com.system.config.SecurityConfig.class, JwtAuthenticationFilter.class,
        RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class CustomerDepositHistorySecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DepositService depositService;

    @MockBean
    private AppUserRepository appUserRepository;

    @MockBean
    private JwtTokenService jwtTokenService;

    @Test
    void requiresAuthenticationAndDoesNotTrustUserIdHeader() throws Exception {
        mockMvc.perform(get("/api/v1/deposits/my").header("X-User-Id", "1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsStaffRole() throws Exception {
        AppUser staff = new AppUser();
        staff.setUsername("staff-user");
        staff.setEmail("staff@example.test");
        staff.setFullName("Staff User");
        staff.setRole(Role.STAFF);
        staff.setEmailVerified(true);
        when(jwtTokenService.extractUserId("staff-token")).thenReturn(42L);
        when(appUserRepository.findById(42L)).thenReturn(Optional.of(staff));

        mockMvc.perform(get("/api/v1/deposits/my").header("Authorization", "Bearer staff-token"))
                .andExpect(status().isForbidden());
    }
}
