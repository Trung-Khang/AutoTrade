package com.system.security;

import com.system.entity.AppUser;
import com.system.repository.AppUserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenService jwtTokenService;
    private final AppUserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, AppUserRepository userRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Long userId = jwtTokenService.extractUserId(header.substring(7));
            AppUser user = userRepository.findById(userId).orElse(null);
            if (user != null && user.isActive() && user.isEmailVerified() && !user.isLocked()
                    && SecurityContextHolder.getContext().getAuthentication() == null) {
                AppUserPrincipal principal = AppUserPrincipal.from(user);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (JwtException | IllegalArgumentException | IllegalStateException ignored) {
            // An invalid token is treated as unauthenticated. Never echo or log its value.
        }
        filterChain.doFilter(request, response);
    }
}
