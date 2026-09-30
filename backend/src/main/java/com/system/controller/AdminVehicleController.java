package com.system.controller;

import com.system.dto.VehicleRequest;
import com.system.entity.Vehicle;
import com.system.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/vehicles")
@Tag(name = "5. Admin Vehicle API", description = "Các API cho Quản trị viên thực hiện CRUD và đổi trạng thái xe độc bản")
public class AdminVehicleController {

    private final VehicleService vehicleService;

    public AdminVehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    // 1. Admin thêm mới một xe vào kho showroom
    @PostMapping
    @Operation(summary = "Thêm mới xe vào kho showroom", 
               description = "Admin nhập thông tin xe (số VIN, hãng, dòng, giá bán, ODO, showroom...). Trạng thái mặc định là AVAILABLE.")
    public ResponseEntity<Vehicle> createVehicle(@RequestBody VehicleRequest request) {
        Vehicle created = vehicleService.createVehicle(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // 2. Admin cập nhật thông tin xe
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin xe", 
               description = "Admin cập nhật các thuộc tính kỹ thuật, giá bán, màu sắc, showroom của xe.")
    public ResponseEntity<Vehicle> updateVehicle(
            @PathVariable Long id, 
            @RequestBody VehicleRequest request) {
        Vehicle updated = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(updated);
    }

    // 3. Admin đổi trạng thái xe độc bản
    @PatchMapping("/{id}/status")
    @Operation(summary = "Đổi trạng thái xe", 
               description = "Chuyển đổi trạng thái xe giữa AVAILABLE, HOLD, RESERVED, SOLD.")
    public ResponseEntity<Vehicle> updateVehicleStatus(
            @PathVariable Long id, 
            @RequestParam String status) {
        Vehicle updated = vehicleService.updateVehicleStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    // 4. Admin xóa xe khỏi hệ thống
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa xe", 
               description = "Xóa một xe khỏi kho showroom theo ID.")
    public ResponseEntity<String> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok("Đã xóa thành công xe với ID: " + id);
    }
}
