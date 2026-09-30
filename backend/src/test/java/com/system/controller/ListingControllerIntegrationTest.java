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
class ListingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private SourceRepository sourceRepository;

    private Listing sampleListing;

    @BeforeEach
    void setUp() {
        Source source = sourceRepository.save(new Source("controller-test-source-" + System.currentTimeMillis(), "https://test.com"));

        Vehicle vehicle = vehicleRepository.save(new Vehicle("Toyota", "Camry", "2.5Q", 2022, "Gasoline", "Automatic", 2.5, 5, "Domestic", "Sedan"));

        sampleListing = listingRepository.save(new Listing(vehicle, source, new BigDecimal("1050000000"), 20000, "TP. Hồ Chí Minh",
                "https://test.com/camry-" + System.currentTimeMillis(), "https://img.test.com/camry.jpg", Instant.now()));
    }

    @Test
    @DisplayName("GET /api/v1/listings: Trả về HTTP 200 kèm cấu trúc phân trang và danh sách tin đăng")
    void testGetAllListingsWithPagination() throws Exception {
        mockMvc.perform(get("/api/v1/listings")
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
    @DisplayName("GET /api/v1/listings?brand=Toyota&minPrice=1000000000: Lọc theo hãng và khoảng giá thành công")
    void testFilterListings() throws Exception {
        mockMvc.perform(get("/api/v1/listings")
                        .param("brand", "Toyota")
                        .param("minPrice", "1000000000")
                        .param("sort", "price,asc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.content[0].brand", is("Toyota")))
                .andExpect(jsonPath("$.content[0].model", is("Camry")));
    }

    @Test
    @DisplayName("GET /api/v1/listings/{id}: Lấy chi tiết một tin đăng dưới dạng DTO phẳng")
    void testGetListingById() throws Exception {
        mockMvc.perform(get("/api/v1/listings/" + sampleListing.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(sampleListing.getId().intValue())))
                .andExpect(jsonPath("$.brand", is("Toyota")))
                .andExpect(jsonPath("$.model", is("Camry")))
                .andExpect(jsonPath("$.variant", is("2.5Q")))
                .andExpect(jsonPath("$.manufacture_year", is(2022)))
                .andExpect(jsonPath("$.image_url", is("https://img.test.com/camry.jpg")))
                .andExpect(jsonPath("$.price", is(1050000000)));
    }

    @Test
    @DisplayName("GET /api/v1/listings/{id}: Trả về HTTP 404 khi ID không tồn tại")
    void testGetListingNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/listings/999999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsString("999999999")));
    }
}
