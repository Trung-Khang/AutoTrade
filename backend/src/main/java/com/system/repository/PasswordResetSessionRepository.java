package com.system.repository;

import com.system.entity.PasswordResetSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;
import java.util.List;

public interface PasswordResetSessionRepository extends JpaRepository<PasswordResetSession, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PasswordResetSession> findByTokenHashAndConsumedAtIsNull(String tokenHash);

    List<PasswordResetSession> findByUserIdAndConsumedAtIsNull(Long userId);
}
