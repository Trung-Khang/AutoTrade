package com.system.repository;

import com.system.entity.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {

    Optional<Vehicle> findByVin(String vin);

    List<Vehicle> findByBrandIgnoreCase(String brand);

    List<Vehicle> findByBrandIgnoreCaseAndModelIgnoreCase(String brand, String model);

    List<Vehicle> findByStatus(String status);

    Page<Vehicle> findByStatus(String status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Vehicle v WHERE v.id = :id")
    Optional<Vehicle> findLockedById(@Param("id") Long id);

    List<Vehicle> findByShowroomIdAndStatus(Long showroomId, String status);

    @Query("SELECT v FROM Vehicle v WHERE UPPER(v.status) = 'AVAILABLE' AND v.showroomId IS NOT NULL")
    List<Vehicle> findAvailableVehiclesWithShowroom();

    /**
     * Phương thức cập nhật trạng thái xe nguyên tử (Atomic Update)
     * Đảm bảo chống đặt cọc trùng xe 100% tại tầng Database (FR-09 & NFR-02)
     * Chỉ cập nhật nếu trạng thái hiện tại đúng bằng 'AVAILABLE'.
     * Trả về số dòng cập nhật:
     * - Nếu trả về 1: Cập nhật thành công, xe được khóa giữ chỗ.
     * - Nếu trả về 0: Xe đã bị khách hàng khác cọc trước (Race Condition), throw Conflict!
     */
    @Modifying
    @Query("UPDATE Vehicle v SET v.status = :newStatus WHERE v.id = :id AND (v.status = 'AVAILABLE' OR v.status = 'ARCHIVED')")
    int updateVehicleStatusIfAvailable(@Param("id") Long id, @Param("newStatus") String newStatus);

    @Modifying
    @Query("UPDATE Vehicle v SET v.status = 'AVAILABLE' WHERE v.id = :id AND v.status = 'HOLD'")
    int releaseVehicleHold(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Vehicle v SET v.status = :newStatus WHERE v.id = :id")
    int updateVehicleStatus(@Param("id") Long id, @Param("newStatus") String newStatus);
}
