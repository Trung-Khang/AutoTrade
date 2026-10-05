package com.system.service;

import com.system.dto.ChatbotCompareRequest;
import com.system.dto.ChatbotCompareResponse;
import com.system.entity.Listing;
import com.system.entity.Vehicle;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.ListingRepository;
import com.system.repository.ShowroomRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatbotComparisonServiceUnitTest {
    @Mock
    private ListingRepository listingRepository;
    @Mock
    private ShowroomRepository showroomRepository;

    @Test
    void comparesRealListingDataAndCalculatesFamilyScore() {
        Listing a = listing(10811L, "Toyota", "Innova", "2.0E", 2024, 7,
                "MPV", new BigDecimal("770000000"), 20000, "AVAILABLE", 1L);
        Listing b = listing(10812L, "Kia", "K3", "1.6", 2022, 5,
                "Sedan", new BigDecimal("600000000"), 50000, "HOLD", 1L);
        when(listingRepository.findById(10811L)).thenReturn(Optional.of(a));
        when(listingRepository.findById(10812L)).thenReturn(Optional.of(b));
        when(showroomRepository.findById(1L)).thenReturn(Optional.empty());

        ChatbotCompareRequest request = new ChatbotCompareRequest();
        request.setListingIds(List.of(10811L, 10812L));
        request.setPurpose("xe gia đình 7 chỗ");

        ChatbotCompareResponse response = new ChatbotComparisonService(listingRepository, showroomRepository).compare(request);

        assertEquals(2, response.getVehicles().size());
        assertEquals(10811L, response.getVehicles().get(0).getVehicle().getListingId());
        assertEquals("Toyota Innova 2.0E", response.getVehicles().get(0).getVehicle().getTitle());
        assertTrue(response.getVehicles().get(0).getScore() > response.getVehicles().get(1).getScore());
        assertTrue(response.getVehicles().get(0).getScore() >= 60);
        assertTrue(response.getVehicles().get(0).getScoreExplanation().contains("Điểm cơ sở 60"));
        assertEquals(10811L, response.getRecommendedListingId());
        assertTrue(response.getVehicles().get(0).getVehicle().isDepositEligible());
        assertFalse(response.getVehicles().get(1).getVehicle().isDepositEligible());
        assertTrue(response.getVehicles().get(0).getAdvantages().stream().anyMatch(value -> value.contains("chỗ")));
    }

    @Test
    void rejectsMissingListing() {
        when(listingRepository.findById(10811L)).thenReturn(Optional.empty());
        ChatbotCompareRequest request = new ChatbotCompareRequest();
        request.setListingIds(List.of(10811L, 10812L));

        assertThrows(ResourceNotFoundException.class,
                () -> new ChatbotComparisonService(listingRepository, showroomRepository).compare(request));
        verify(listingRepository, never()).findById(10812L);
    }

    @Test
    void rejectsComparingSameListing() {
        ChatbotCompareRequest request = new ChatbotCompareRequest();
        request.setListingIds(List.of(10811L, 10811L));

        assertThrows(IllegalArgumentException.class,
                () -> new ChatbotComparisonService(listingRepository, showroomRepository).compare(request));
        verifyNoInteractions(listingRepository, showroomRepository);
    }

    @Test
    void rejectsMoreThanFourListings() {
        ChatbotCompareRequest request = new ChatbotCompareRequest();
        request.setListingIds(List.of(1L, 2L, 3L, 4L, 5L));

        assertThrows(IllegalArgumentException.class,
                () -> new ChatbotComparisonService(listingRepository, showroomRepository).compare(request));
        verifyNoInteractions(listingRepository, showroomRepository);
    }

    @Test
    void rejectsThreeListingsAfterComparisonWasReducedToTwo() {
        ChatbotCompareRequest request = new ChatbotCompareRequest();
        request.setListingIds(List.of(1L, 2L, 3L));

        assertThrows(IllegalArgumentException.class,
                () -> new ChatbotComparisonService(listingRepository, showroomRepository).compare(request));
        verifyNoInteractions(listingRepository, showroomRepository);
    }

    private Listing listing(Long listingId, String brand, String model, String variant, int year, int seats,
                            String bodyType, BigDecimal price, int mileage, String status, Long showroomId) {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(listingId + 10000);
        vehicle.setBrand(brand);
        vehicle.setModel(model);
        vehicle.setVariant(variant);
        vehicle.setManufactureYear(year);
        vehicle.setSeatCount(seats);
        vehicle.setBodyType(bodyType);
        vehicle.setFuelType("Xăng");
        vehicle.setTransmission("Tự động");
        vehicle.setStatus(status);
        vehicle.setShowroomId(showroomId);

        Listing listing = new Listing();
        listing.setId(listingId);
        listing.setVehicle(vehicle);
        listing.setPrice(price);
        listing.setMileage(mileage);
        listing.setImageUrl("https://example.test/car.jpg");
        return listing;
    }
}
