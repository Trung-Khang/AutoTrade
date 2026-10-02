package com.system.service;

import com.system.dto.AdminListingRequest;
import com.system.dto.ListingResponseDto;
import com.system.entity.Listing;
import com.system.entity.Source;
import com.system.entity.Vehicle;
import com.system.repository.ListingRepository;
import com.system.repository.SourceRepository;
import com.system.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminListingServiceUnitTest {
    @Mock private ListingRepository listingRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private SourceRepository sourceRepository;

    private AdminListingService service;
    private Listing listing;

    @BeforeEach
    void setUp() {
        service = new AdminListingService(listingRepository, vehicleRepository, sourceRepository);
        Vehicle vehicle = new Vehicle("Toyota", "Camry", "2.5Q", 2021,
                "Gasoline", "Automatic", 2.5, 5, "Imported", "Sedan");
        vehicle.setId(81L);
        vehicle.setStatus("ARCHIVED");
        Source source = new Source("bonbanh", "https://bonbanh.com");
        source.setId(2L);
        listing = new Listing(vehicle, source, new BigDecimal("920000000"), 80000,
                "Hà Nội", "https://example.test/10813", "https://example.test/car.jpg", Instant.now());
        listing.setId(10813L);
    }

    @Test
    void updateChangesListingAndItsLinkedVehicle() {
        when(listingRepository.findById(10813L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(listing)).thenReturn(listing);

        ListingResponseDto response = service.update(10813L, request("HOLD"));

        assertEquals("Hyundai", listing.getVehicle().getBrand());
        assertEquals(new BigDecimal("880000000"), listing.getPrice());
        assertEquals("HOLD", response.getStatus());
        verify(vehicleRepository).save(listing.getVehicle());
        verify(listingRepository).save(listing);
    }

    @Test
    void updateStatusUsesListingIdAndUpdatesLinkedVehicle() {
        when(listingRepository.findById(10813L)).thenReturn(Optional.of(listing));

        ListingResponseDto response = service.updateStatus(10813L, "SOLD");

        assertEquals("SOLD", listing.getVehicle().getStatus());
        assertEquals("SOLD", response.getStatus());
        verify(vehicleRepository).save(listing.getVehicle());
    }

    @Test
    void createPersistsVehicleAndListingInOneServiceCall() {
        Source source = new Source("AutoTrade", "https://autotrade.vn");
        source.setId(9L);
        when(sourceRepository.findBySourceName("AutoTrade")).thenReturn(Optional.of(source));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> {
            Vehicle vehicle = invocation.getArgument(0);
            vehicle.setId(99L);
            return vehicle;
        });
        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
            Listing saved = invocation.getArgument(0);
            saved.setId(100L);
            return saved;
        });

        ListingResponseDto response = service.create(request("AVAILABLE"));

        assertEquals(100L, response.getId());
        assertEquals(99L, response.getVehicleId());
        assertEquals("AVAILABLE", response.getStatus());
    }

    @Test
    void deleteRemovesOnlyTheSelectedListing() {
        when(listingRepository.findById(10813L)).thenReturn(Optional.of(listing));

        service.delete(10813L);

        verify(listingRepository).delete(listing);
        verify(vehicleRepository, never()).delete(any(Vehicle.class));
    }

    private AdminListingRequest request(String status) {
        return new AdminListingRequest("Hyundai", "SantaFe", "Cao cấp", 2021,
                "Diesel", "Automatic", 2.2, 7, "Imported", "SUV / Crossover",
                new BigDecimal("880000000"), 75000, "Đen", "Hà Nội",
                "https://example.test/new-car.jpg", status);
    }
}
