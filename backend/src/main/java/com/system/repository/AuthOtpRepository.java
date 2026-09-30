package com.system.repository;

import com.system.entity.AuthOtp;
import com.system.entity.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface AuthOtpRepository extends JpaRepository<AuthOtp, Long> {
    List<AuthOtp> findByUserIdAndPurposeAndConsumedAtIsNullAndInvalidatedAtIsNull(Long userId, OtpPurpose purpose);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthOtp> findFirstByUserIdAndPurposeAndConsumedAtIsNullAndInvalidatedAtIsNullOrderByCreatedAtDesc(
            @Param("userId") Long userId, @Param("purpose") OtpPurpose purpose);
}
