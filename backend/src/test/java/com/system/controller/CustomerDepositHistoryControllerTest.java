package com.system.controller;

import com.system.dto.CustomerDepositResponse;
import com.system.dto.DepositResponse;
import com.system.exception.AuthException;
import com.system.security.AppUserPrincipal;
import com.system.service.DepositService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class CustomerDepositHistoryControllerTest {
    private final DepositService depositService = mock(DepositService.class);
    private final DepositController controller = new DepositController(depositService);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void currentJwtPrincipalIdScopesTheHistoryQuery() {
        AppUserPrincipal principal = new AppUserPrincipal(73L, "customer", "hash", "Customer",
                "customer@example.test", "0900000000", com.system.entity.Role.CUSTOMER, true, false);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        List<CustomerDepositResponse> expected = List.of();
        when(depositService.getMyDeposits(73L)).thenReturn(expected);

        assertSame(expected, controller.getMyDeposits().getBody());

        verify(depositService).getMyDeposits(73L);
    }

    @Test
    void missingAuthenticatedPrincipalIsUnauthorized() {
        AuthException error = assertThrows(AuthException.class, controller::getMyDeposits);

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
        verifyNoInteractions(depositService);
    }

    @Test
    void staffCannotCreateOrConfirmDeposits() {
        AppUserPrincipal principal = new AppUserPrincipal(73L, "staff", "hash", "Staff",
                "staff@example.test", "0900000001", com.system.entity.Role.STAFF, true, false);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        AuthException createError = assertThrows(AuthException.class,
                () -> controller.createDeposit(null));
        AuthException confirmError = assertThrows(AuthException.class,
                () -> controller.confirmPayment(10L));

        assertEquals(HttpStatus.FORBIDDEN, createError.getStatus());
        assertEquals(HttpStatus.FORBIDDEN, confirmError.getStatus());
        verifyNoInteractions(depositService);
    }

    @Test
    void currentCustomerCanResumeOwnPendingPayment() {
        AppUserPrincipal principal = new AppUserPrincipal(73L, "customer", "hash", "Customer",
                "customer@example.test", "0900000000", com.system.entity.Role.CUSTOMER, true, false);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        DepositResponse expected = new DepositResponse();
        expected.setDepositId(50L);
        expected.setStatus("PENDING");
        when(depositService.getPendingPayment(50L, 73L)).thenReturn(expected);

        assertSame(expected, controller.getPendingPayment(50L).getBody());
        verify(depositService).getPendingPayment(50L, 73L);
    }
}
