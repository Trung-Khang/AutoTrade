package com.system.repository;

import com.system.entity.Deposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepositRepository extends JpaRepository<Deposit, Long> {

    Optional<Deposit> findByDepositCode(String depositCode);

    List<Deposit> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Deposit> findByVehicleId(Long vehicleId);

    List<Deposit> findByStatus(String status);

    boolean existsByUserId(Long userId);
}
