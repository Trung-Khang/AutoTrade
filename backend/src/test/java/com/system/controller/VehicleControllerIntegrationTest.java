package com.system.controller;

import com.system.entity.Showroom;
import com.system.entity.Vehicle;
import com.system.repository.ShowroomRepository;
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
    private VehicleRepository vehicleRepository;

    @Autowired
    private ShowroomRepository showroomRepository;

    private Vehicle testVehicle;

    @BeforeEach
    void setUp() {
        Showroom showroom = showroomRepository.save(new Showroom(
                "AutoTrade Cần Thơ", "1 Test Street", "0123456789", "Cần Thơ"));
        Vehicle vehicle = new Vehicle("Hyundai", "Accent", "1.4 AT", 2021,
                "Gasoline", "Automatic", 1.4, 5, "Domestic", "Sedan");
        vehicle.setPrice(new BigDecimal("435000000"));
        vehicle.setMileage(35000);
        vehicle.setImageUrl("https://img.test.com/accent.jpg");
        vehicle.setShowroomId(showroom.getId());
        vehicle.setStatus("AVAILABLE");
        testVehicle = vehicleRepository.save(vehicle);
    }

    @Test
    @DisplayName("GET /api/v1/vehicles: Chỉ trả về kho xe showroom đang mở bán")
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
    @DisplayName("GET /api/v1/vehicles: Không đếm xe archive hoặc xe không thuộc showroom")
    void testExcludesMarketplaceArchiveFromShowroomInventory() throws Exception {
        Vehicle archived = new Vehicle("Hyundai", "Accent", "Marketplace", 2020,
                "Gasoline", "Automatic", 1.4, 5, "Domestic", "Sedan");
        archived.setPrice(new BigDecimal("300000000"));
        archived.setStatus("AVAILABLE");
        vehicleRepository.save(archived);

        mockMvc.perform(get("/api/v1/vehicles")
                        .param("vehicleId", archived.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    @Test
    @DisplayName("GET /api/v1/vehicles/{id}: Lấy chi tiết xe kèm giá bán, ODO, thông số kỹ thuật dạng phẳng DTO")
    void testGetVehicleByIdFlatDto() throws Exception {
        mockMvc.perform(get("/api/v1/vehicles/" + testVehicle.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(testVehicle.getId().intValue())))
                .andExpect(jsonPath("$.brand", is("Hyundai")))
                .andExpect(jsonPath("$.model", is("Accent")))
                .andExpect(jsonPath("$.price", is(435000000)))
                .andExpect(jsonPath("$.mileage", is(35000)))
                .andExpect(jsonPath("$.manufactureYear", is(2021)))
                .andExpect(jsonPath("$.imageUrl", is("https://img.test.com/accent.jpg")))
                .andExpect(jsonPath("$.showroom.city", is("Cần Thơ")));
    }
}
