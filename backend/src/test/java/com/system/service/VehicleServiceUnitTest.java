package com.system.service;

import com.system.dto.ListingFilterRequest;
import com.system.dto.VehicleResponse;
import com.system.entity.Showroom;
import com.system.entity.Vehicle;
import com.system.repository.ShowroomRepository;
import com.system.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleServiceUnitTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ShowroomRepository showroomRepository;

    private VehicleService vehicleService;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleService(vehicleRepository, showroomRepository);
    }

    @Test
    void searchAvailableVehiclesPreservesPhysicalInventoryPaginationAndShowroom() {
        Vehicle vehicle = new Vehicle("Toyota", "Camry", "2.5Q", 2022,
                "Gasoline", "Automatic", 2.5, 5, "Imported", "Sedan");
        vehicle.setId(7L);
        vehicle.setPrice(new BigDecimal("1050000000"));
        vehicle.setShowroomId(3L);
        Showroom showroom = new Showroom("AutoTrade Central", "1 Main Street", "0123456789", "Hà Nội");
        showroom.setId(3L);
        PageRequest pageable = PageRequest.of(0, 20);

        when(vehicleRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(vehicle), pageable, 1));
        when(showroomRepository.findById(3L)).thenReturn(Optional.of(showroom));

        Page<VehicleResponse> result = vehicleService.searchAvailableVehicles(new ListingFilterRequest(), pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(7L, result.getContent().get(0).getId());
        assertSame(showroom, result.getContent().get(0).getShowroom());
        verify(vehicleRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getShowroomInventoryKeepsAllBusinessStatuses() {
        Vehicle available = vehicle(7L, "AVAILABLE", 3L);
        Vehicle hold = vehicle(8L, "HOLD", 3L);
        PageRequest pageable = PageRequest.of(0, 100);
        when(vehicleRepository.findByShowroomIdIsNotNull(pageable))
                .thenReturn(new PageImpl<>(List.of(available, hold), pageable, 2));
        when(showroomRepository.findById(3L)).thenReturn(Optional.empty());

        Page<VehicleResponse> result = vehicleService.getShowroomInventory(pageable);

        assertEquals(2, result.getTotalElements());
        assertEquals(List.of("AVAILABLE", "HOLD"),
                result.getContent().stream().map(VehicleResponse::getStatus).toList());
    }

    private Vehicle vehicle(Long id, String status, Long showroomId) {
        Vehicle vehicle = new Vehicle("Toyota", "Camry", "2.5Q", 2022,
                "Gasoline", "Automatic", 2.5, 5, "Imported", "Sedan");
        vehicle.setId(id);
        vehicle.setStatus(status);
        vehicle.setShowroomId(showroomId);
        return vehicle;
    }
}
