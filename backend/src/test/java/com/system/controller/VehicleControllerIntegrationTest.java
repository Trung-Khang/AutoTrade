package com.system.controller;

import com.system.entity.Listing;
import com.system.entity.Source;
import com.system.entity.Vehicle;
import com.system.repository.ListingRepository;
import com.system.repository.SourceRepository;
import com.system.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class VehicleControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private SourceRepository sourceRepository;

    private Listing testListing;

    @BeforeEach
    void setUp() {
        Source source = sourceRepository.save(new Source("vc-source-" + System.currentTimeMillis(), "https://test.com"));

        Vehicle vehicle = vehicleRepository.save(new Vehicle("Hyundai", "Accent", "1.4 AT", 2021, "Gasoline", "Automatic", 1.4, 5, "Domestic", "Sedan"));

        testListing = listingRepository.save(new Listing(vehicle, source, new BigDecimal("435000000"), 35000, "Cần Thơ",
                "https://test.com/accent-" + System.currentTimeMillis(), "https://img.test.com/accent.jpg", Instant.now()));
    }

    @Test
    @DisplayName("GET /api/v1/vehicles: Trả về phân trang và danh sách xe tin đăng thị trường")
    void testGetAllVehiclesPaginated() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()))
                .andExpect(jsonPath("$.page", is(0)))
                .andExpect(jsonPath("$.size", is(10)))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalPages", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("GET /api/v1/vehicles?brand=Hyundai&minPrice=400000000: Lọc theo hãng và giá")
    void testFilterVehicles() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles")
                        .param("brand", "Hyundai")
                        .param("minPrice", "400000000")
                        .param("maxPrice", "500000000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].brand", is("Hyundai")))
                .andExpect(jsonPath("$.content[0].model", is("Accent")));
    }

    @Test
    @DisplayName("GET /api/v1/vehicles/{id}: Lấy chi tiết xe kèm giá bán, ODO, thông số kỹ thuật dạng phẳng DTO")
    void testGetVehicleByIdFlatDto() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles/" + testListing.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testListing.getId().intValue())))
                .andExpect(jsonPath("$.brand", is("Hyundai")))
                .andExpect(jsonPath("$.model", is("Accent")))
                .andExpect(jsonPath("$.price", is(435000000)))
                .andExpect(jsonPath("$.mileage", is(35000)))
                .andExpect(jsonPath("$.manufacture_year", is(2021)))
                .andExpect(jsonPath("$.image_url", is("https://img.test.com/accent.jpg")));
    }
}
