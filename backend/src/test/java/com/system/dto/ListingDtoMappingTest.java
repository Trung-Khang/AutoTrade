package com.system.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.system.entity.Listing;
import com.system.entity.Source;
import com.system.entity.Vehicle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class ListingDtoMappingTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Test mapping đầy đủ các trường từ Listing, Vehicle và Source sang ListingResponseDto")
    void testFullMappingFromEntity() {
        Vehicle vehicle = new Vehicle("Toyota", "Vios", "1.5G", 2021, "Gasoline", "Automatic", 1.5, 5, "Domestic", "Sedan");
        vehicle.setId(10L);
        vehicle.setStatus("ARCHIVED");

        Source source = new Source("bonbanh", "https://bonbanh.com");
        source.setId(1L);

        Listing listing = new Listing(vehicle, source, new BigDecimal("495000000"), 38000, "TP. Hồ Chí Minh",
                "https://bonbanh.com/xe-123", "https://img.bonbanh.com/123.jpg", Instant.now());
        listing.setId(100L);
        listing.setColor("Trắng");
        listing.setListedAtRaw("2 ngày trước");

        ListingResponseDto dto = ListingResponseDto.fromEntity(listing);

        assertNotNull(dto);
        assertEquals(100L, dto.getId());
        assertEquals(new BigDecimal("495000000"), dto.getPrice());
        assertEquals(38000, dto.getMileage());
        assertEquals("Trắng", dto.getColor());
        assertEquals("TP. Hồ Chí Minh", dto.getLocation());
        assertEquals("https://bonbanh.com/xe-123", dto.getSourceUrl());
        assertEquals("https://img.bonbanh.com/123.jpg", dto.getImageUrl());
        assertEquals("2 ngày trước", dto.getListedAtRaw());

        // Vehicle info
        assertEquals(10L, dto.getVehicleId());
        assertEquals("Toyota", dto.getBrand());
        assertEquals("Vios", dto.getModel());
        assertEquals("1.5G", dto.getVariant());
        assertEquals(2021, dto.getManufactureYear());
        assertEquals("Gasoline", dto.getFuelType());
        assertEquals("Automatic", dto.getTransmission());
        assertEquals(1.5, dto.getEngineSize());
        assertEquals(5, dto.getSeatCount());
        assertEquals("Domestic", dto.getOrigin());
        assertEquals("Sedan", dto.getBodyType());
        assertEquals("AVAILABLE", dto.getStatus());

        // Source info
        assertEquals(1L, dto.getSourceId());
        assertEquals("bonbanh", dto.getSourceName());
    }

    @Test
    @DisplayName("Test mapping an toàn khi các trường tùy chọn hoặc quan hệ là null")
    void testMappingWithNullFields() {
        Vehicle vehicle = new Vehicle("VinFast", "VF 3", null, 2025, null, null, null);
        vehicle.setId(20L);

        Listing listing = new Listing();
        listing.setId(200L);
        listing.setVehicle(vehicle);
        listing.setPrice(new BigDecimal("240000000"));
        listing.setSourceUrl("https://chotot.com/xe-vf3");

        ListingResponseDto dto = ListingResponseDto.fromEntity(listing);

        assertNotNull(dto);
        assertEquals(200L, dto.getId());
        assertEquals("VinFast", dto.getBrand());
        assertEquals("VF 3", dto.getModel());
        assertNull(dto.getVariant());
        assertNull(dto.getMileage());
        assertNull(dto.getFuelType());
        assertNull(dto.getTransmission());
        assertNull(dto.getSourceId());
        assertNull(dto.getSourceName());
    }

    @Test
    @DisplayName("Test tuần tự hóa JSON sinh cả trường camelCase và snake_case cho Frontend")
    void testJsonSerializationContainsSnakeCaseAliases() throws Exception {
        Vehicle vehicle = new Vehicle("Mazda", "CX-5", "2.0 Premium", 2022, "Gasoline", "Automatic", 2.0, 5, "Domestic", "SUV / Crossover");
        vehicle.setId(30L);

        Listing listing = new Listing(vehicle, null, new BigDecimal("750000000"), 20000, "Hà Nội",
                "https://example.com/cx5", "https://example.com/cx5.jpg", Instant.now());
        listing.setId(300L);

        ListingResponseDto dto = ListingResponseDto.fromEntity(listing);
        String json = objectMapper.writeValueAsString(dto);

        // Kiểm tra tồn tại cả camelCase lẫn snake_case trong JSON
        assertTrue(json.contains("\"manufactureYear\":2022"));
        assertTrue(json.contains("\"manufacture_year\":2022"));

        assertTrue(json.contains("\"fuelType\":\"Gasoline\""));
        assertTrue(json.contains("\"fuel_type\":\"Gasoline\""));

        assertTrue(json.contains("\"bodyType\":\"SUV / Crossover\""));
        assertTrue(json.contains("\"body_type\":\"SUV / Crossover\""));

        assertTrue(json.contains("\"sourceUrl\":\"https://example.com/cx5\""));
        assertTrue(json.contains("\"source_url\":\"https://example.com/cx5\""));

        assertTrue(json.contains("\"imageUrl\":\"https://example.com/cx5.jpg\""));
        assertTrue(json.contains("\"image_url\":\"https://example.com/cx5.jpg\""));
    }
}
