package com.system.config;

import com.system.repository.AppUserRepository;
import com.system.security.AppUserPrincipal;
import com.system.security.JwtAuthenticationFilter;
import com.system.security.RestAccessDeniedHandler;
import com.system.security.RestAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public UserDetailsService userDetailsService(AppUserRepository appUserRepository) {
        return identifier -> appUserRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .map(AppUserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay tai khoan."));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthenticationFilter jwtAuthenticationFilter,
                                                   RestAuthenticationEntryPoint authenticationEntryPoint,
                                                   RestAccessDeniedHandler accessDeniedHandler) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/auth/register",
                                "/api/v1/auth/verify-email",
                                "/api/v1/auth/resend-verification",
                                "/api/v1/auth/login",
                                "/api/v1/auth/forgot-password",
                                "/api/v1/auth/verify-reset-otp",
                                "/api/v1/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/me").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/auth/me").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/vehicles/**", "/api/v1/listings/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/deposits", "/api/v1/deposits/*/confirm").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/v1/deposits/*/receipt", "/api/v1/deposits/my").hasRole("CUSTOMER")
                        .requestMatchers("/api/v1/deposits/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/staff/appointments/**").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/staff/appointments/**").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers("/api/v1/staff/**").denyAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/vehicles/**", "/api/v1/listings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/vehicles/**", "/api/v1/listings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/vehicles/**", "/api/v1/listings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/admin/users/*/profile").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/vehicles/**", "/api/v1/listings/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/auth/**").denyAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
