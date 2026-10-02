package com.system.repository;

import com.system.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByDepositId(Long depositId);

    List<Appointment> findByUserIdOrderByAppointmentDateDesc(Long userId);

    List<Appointment> findByShowroomIdOrderByAppointmentDateAsc(Long showroomId);

    List<Appointment> findByAppointmentDateBetweenOrderByAppointmentDateAsc(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByStatus(String status);

    boolean existsByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Appointment a WHERE a.id = :id")
    Optional<Appointment> findLockedById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Appointment a WHERE a.depositId = :depositId")
    Optional<Appointment> findLockedByDepositId(@Param("depositId") Long depositId);
}
