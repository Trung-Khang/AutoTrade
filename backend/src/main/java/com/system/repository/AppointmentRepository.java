package com.system.repository;

import com.system.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
