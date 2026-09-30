package com.system.repository;

import com.system.entity.Showroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShowroomRepository extends JpaRepository<Showroom, Long> {
    List<Showroom> findByCityIgnoreCase(String city);
}
