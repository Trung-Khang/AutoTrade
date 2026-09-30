package com.system.service;

import com.system.dto.VehicleRequest;
import com.system.dto.VehicleResponse;
import com.system.entity.Showroom;
import com.system.entity.Vehicle;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.ShowroomRepository;
import com.system.repository.VehicleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final ShowroomRepository showroomRepository;

    public VehicleService(VehicleRepository vehicleRepository, ShowroomRepository showroomRepository) {
        this.vehicleRepository = vehicleRepository;
        this.showroomRepository = showroomRepository;
    }

    // 1. Lấy danh sách xe đang AVAILABLE phục vụ người dùng xem/tìm kiếm (Public Catalog)
    @Transactional(readOnly = true)
    public Page<VehicleResponse> getAvailableVehicles(Pageable pageable) {
        Page<Vehicle> vehiclePage = vehicleRepository.findByStatus("AVAILABLE", pageable);
        List<VehicleResponse> dtoList = new ArrayList<>();

        for (Vehicle v : vehiclePage.getContent()) {
            Showroom s = null;
            if (v.getShowroomId() != null) {
                s = showroomRepository.findById(v.getShowroomId()).orElse(null);
            }
            dtoList.add(new VehicleResponse(v, s));
        }

        return new PageImpl<>(dtoList, pageable, vehiclePage.getTotalElements());
    }

    // 2. Lấy chi tiết xe theo ID kèm thông tin showroom
    @Transactional(readOnly = true)
    public VehicleResponse getVehicleResponseById(Long id) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy xe với ID: " + id));

        Showroom s = null;
        if (v.getShowroomId() != null) {
            s = showroomRepository.findById(v.getShowroomId()).orElse(null);
        }

        return new VehicleResponse(v, s);
    }

    // 3. Lấy entity gốc
    @Transactional(readOnly = true)
    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy xe với ID: " + id));
    }

    // Tương thích ngược
    @Transactional
    public Vehicle createVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    // 4. Admin thêm mới một xe vào kho showroom (FR-13)
    @Transactional
    public Vehicle createVehicle(VehicleRequest request) {
        Vehicle v = new Vehicle();
        v.setVin(request.getVin() != null ? request.getVin() : "VIN-" + System.currentTimeMillis());
        v.setBrand(request.getBrand());
        v.setModel(request.getModel());
        v.setVariant(request.getVariant());
        v.setManufactureYear(request.getManufactureYear());
        v.setFuelType(request.getFuelType());
        v.setTransmission(request.getTransmission());
        v.setEngineSize(request.getEngineSize());
        v.setSeatCount(request.getSeatCount());
        v.setOrigin(request.getOrigin());
        v.setBodyType(request.getBodyType());
        v.setPrice(request.getPrice());
        v.setMileage(request.getMileage());
        v.setColor(request.getColor());
        v.setImageUrl(request.getImageUrl());
        v.setDescription(request.getDescription());
        v.setShowroomId(request.getShowroomId());
        v.setStatus("AVAILABLE");

        return vehicleRepository.save(v);
    }

    // Tương thích ngược
    @Transactional
    public Vehicle updateVehicle(Long id, Vehicle vehicleDetails) {
        Vehicle existing = getVehicleById(id);
        existing.setBrand(vehicleDetails.getBrand());
        existing.setModel(vehicleDetails.getModel());
        existing.setVariant(vehicleDetails.getVariant());
        existing.setManufactureYear(vehicleDetails.getManufactureYear());
        existing.setBodyType(vehicleDetails.getBodyType());
        existing.setFuelType(vehicleDetails.getFuelType());
        existing.setTransmission(vehicleDetails.getTransmission());
        return vehicleRepository.save(existing);
    }

    // 5. Admin cập nhật thông tin xe
    @Transactional
    public Vehicle updateVehicle(Long id, VehicleRequest request) {
        Vehicle existing = getVehicleById(id);

        if (request.getVin() != null) existing.setVin(request.getVin());
        if (request.getBrand() != null) existing.setBrand(request.getBrand());
        if (request.getModel() != null) existing.setModel(request.getModel());
        if (request.getVariant() != null) existing.setVariant(request.getVariant());
        if (request.getManufactureYear() != null) existing.setManufactureYear(request.getManufactureYear());
        if (request.getFuelType() != null) existing.setFuelType(request.getFuelType());
        if (request.getTransmission() != null) existing.setTransmission(request.getTransmission());
        if (request.getEngineSize() != null) existing.setEngineSize(request.getEngineSize());
        if (request.getSeatCount() != null) existing.setSeatCount(request.getSeatCount());
        if (request.getOrigin() != null) existing.setOrigin(request.getOrigin());
        if (request.getBodyType() != null) existing.setBodyType(request.getBodyType());
        if (request.getPrice() != null) existing.setPrice(request.getPrice());
        if (request.getMileage() != null) existing.setMileage(request.getMileage());
        if (request.getColor() != null) existing.setColor(request.getColor());
        if (request.getImageUrl() != null) existing.setImageUrl(request.getImageUrl());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getShowroomId() != null) existing.setShowroomId(request.getShowroomId());
        if (request.getStatus() != null) existing.setStatus(request.getStatus());

        return vehicleRepository.save(existing);
    }

    // 6. Admin cập nhật trạng thái xe (AVAILABLE, HOLD, RESERVED, SOLD)
    @Transactional
    public Vehicle updateVehicleStatus(Long id, String newStatus) {
        Vehicle vehicle = getVehicleById(id);
        vehicle.setStatus(newStatus);
        return vehicleRepository.save(vehicle);
    }

    // 7. Admin xóa xe
    @Transactional
    public void deleteVehicle(Long id) {
        Vehicle vehicle = getVehicleById(id);
        vehicleRepository.delete(vehicle);
    }

    // 8. Tương thích ngược: Lấy toàn bộ xe
    @Transactional(readOnly = true)
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }
}
