package com.system.repository;

import com.system.entity.Deposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepositRepository extends JpaRepository<Deposit, Long> {

    Optional<Deposit> findByDepositCode(String depositCode);

    List<Deposit> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Deposit> findByVehicleId(Long vehicleId);

    List<Deposit> findByStatus(String status);

    boolean existsByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Deposit d WHERE d.id = :id")
    Optional<Deposit> findLockedById(@Param("id") Long id);

    Optional<Deposit> findByIdAndUserId(Long id, Long userId);
}
