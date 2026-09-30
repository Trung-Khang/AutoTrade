package com.system.security;

import com.system.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtTokenService {
    private final String configuredSecret;
    private final long expirationMinutes;

    public JwtTokenService(@Value("${app.security.jwt-secret}") String configuredSecret,
                           @Value("${app.security.jwt-expiration-minutes}") long expirationMinutes) {
        this.configuredSecret = configuredSecret;
        this.expirationMinutes = expirationMinutes;
    }

    public String generate(AppUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
                .signWith(signingKey())
                .compact();
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser().verifyWith(signingKey()).build()
                .parseSignedClaims(token).getPayload();
        return Long.valueOf(claims.getSubject());
    }

    private SecretKey signingKey() {
        try {
            byte[] bytes = Base64.getDecoder().decode(configuredSecret);
            if (bytes.length < 32) {
                throw new IllegalArgumentException("JWT_SECRET too short");
            }
            return Keys.hmacShaKeyFor(bytes);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(
                    "JWT_SECRET phải là Base64 của ít nhất 32 byte và chỉ được cấu hình trong môi trường chạy.", ex);
        }
    }
}
