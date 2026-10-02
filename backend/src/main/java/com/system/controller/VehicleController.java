package com.system.controller;

import com.system.dto.ListingFilterRequest;
import com.system.dto.ListingResponseDto;
import com.system.dto.PageResponse;
import com.system.entity.Vehicle;
import com.system.service.ListingService;
import com.system.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@Tag(name = "1. Vehicle API", description = "Các API quản lý và tìm kiếm thông tin xe (Market Data Feed & Catalog)")
public class VehicleController {

    private final VehicleService vehicleService;
    private final ListingService listingService;

    public VehicleController(VehicleService vehicleService, ListingService listingService) {
        this.vehicleService = vehicleService;
        this.listingService = listingService;
    }

    //GET: Lấy danh sách xe kèm tìm kiếm, lọc đa tiêu chí, phân trang và sắp xếp
    @GetMapping
    @Operation(summary = "Tìm kiếm & Lọc danh sách xe thị trường", 
               description = "Trả về danh sách xe tin đăng thị trường theo bộ lọc (hãng, dòng xe, khoảng giá, năm sản xuất, ODO, nhiên liệu...), phân trang (page, size) và sắp xếp (sort=price,asc...)")
    public ResponseEntity<PageResponse<ListingResponseDto>> getAllVehicles(
            @ParameterObject ListingFilterRequest filter,
            @ParameterObject @PageableDefault(page = 0, size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ListingResponseDto> response = listingService.searchListings(filter, pageable);
        return ResponseEntity.ok(response);
    }

    //GET /{id}: Lấy chi tiết một xe theo ID (kèm giá, ODO, ảnh dạng phẳng DTO)
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một xe theo ID", description = "Nhận vào ID và trả về thông tin chi tiết kèm thông số xe dạng phẳng DTO")
    public ResponseEntity<ListingResponseDto> getVehicleById(@PathVariable Long id) {
        ListingResponseDto dto = listingService.getListingDtoById(id);
        return ResponseEntity.ok(dto);
    }

    //POST: Thêm mới một dòng xe vào hệ thống
    @PostMapping
    @Operation(summary = "Tạo mới một dòng xe", description = "Nhận thông tin xe từ request body và lưu vào cơ sở dữ liệu")
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        Vehicle createdVehicle = vehicleService.createVehicle(vehicle);
        return new ResponseEntity<>(createdVehicle, HttpStatus.CREATED); // Trả về HTTP 201 Created
    }

    //PUT /{id}: Cập nhật thông tin dòng xe theo ID
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin một dòng xe", description = "Cập nhật các thuộc tính của xe theo ID chỉ định")
    public ResponseEntity<Vehicle> updateVehicle(
            @PathVariable Long id, 
            @RequestBody Vehicle vehicleDetails) {
        Vehicle updatedVehicle = vehicleService.updateVehicle(id, vehicleDetails);
        return ResponseEntity.ok(updatedVehicle);
    }

    //DELETE /{id}: Xóa một dòng xe theo ID
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa một dòng xe theo ID", description = "Xóa bản ghi xe khỏi hệ thống theo ID")
    public ResponseEntity<String> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok("Da xoa thanh cong xe voi ID: " + id);
    }
}
