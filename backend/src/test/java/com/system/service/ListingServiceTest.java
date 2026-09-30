package com.system.service;

import com.system.dto.ListingFilterRequest;
import com.system.dto.ListingResponseDto;
import com.system.dto.PageResponse;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ListingServiceTest {

    @Autowired
    private ListingService listingService;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private SourceRepository sourceRepository;

    private Listing listingLowPrice;
    private Listing listingMidPrice;
    private Listing listingHighPrice;

    @BeforeEach
    void setUp() {
        Source source = sourceRepository.save(new Source("service-test-source-" + System.currentTimeMillis(), "https://test.com"));

        Vehicle v1 = vehicleRepository.save(new Vehicle("Kia", "Morning", "Standard", 2020, "Gasoline", "Manual", 1.25, 5, "Domestic", "Hatchback"));
        Vehicle v2 = vehicleRepository.save(new Vehicle("Mazda", "3", "Luxury", 2022, "Gasoline", "Automatic", 1.5, 5, "Domestic", "Sedan"));
        Vehicle v3 = vehicleRepository.save(new Vehicle("Ford", "Everest", "Titanium", 2023, "Diesel", "Automatic", 2.0, 7, "Imported", "SUV / Crossover"));

        // Giá 200tr, 600tr, 1 tỷ 2
        listingLowPrice = listingRepository.save(new Listing(v1, source, new BigDecimal("200000000"), 50000, "Hà Nội",
                "https://test.com/morning-" + System.currentTimeMillis(), null, Instant.now()));

        listingMidPrice = listingRepository.save(new Listing(v2, source, new BigDecimal("600000000"), 25000, "Đà Nẵng",
                "https://test.com/mazda3-" + System.currentTimeMillis(), null, Instant.now()));

        listingHighPrice = listingRepository.save(new Listing(v3, source, new BigDecimal("1200000000"), 10000, "TP. Hồ Chí Minh",
                "https://test.com/everest-" + System.currentTimeMillis(), null, Instant.now()));
    }

    @Test
    @DisplayName("Test phân trang: page 0, size 2 trả về đúng 2 phần tử và metadata phân trang")
    void testPaginationFirstPage() {
        ListingFilterRequest filter = new ListingFilterRequest();
        PageRequest pageable = PageRequest.of(0, 2);

        PageResponse<ListingResponseDto> response = listingService.searchListings(filter, pageable);

        assertNotNull(response);
        assertEquals(0, response.getPage());
        assertEquals(2, response.getSize());
        assertEquals(2, response.getContent().size());
        assertTrue(response.getTotalElements() >= 3);
        assertTrue(response.isFirst());
    }

    @Test
    @DisplayName("Test sắp xếp theo giá tăng dần (Sort price ASC)")
    void testSortPriceAscending() {
        ListingFilterRequest filter = new ListingFilterRequest();
        PageRequest pageable = PageRequest.of(0, 10, Sort.by("price").ascending());

        PageResponse<ListingResponseDto> response = listingService.searchListings(filter, pageable);

        assertNotNull(response);
        assertTrue(response.getContent().size() >= 3);

        // Kiểm tra thứ tự tăng dần của giá
        for (int i = 0; i < response.getContent().size() - 1; i++) {
            BigDecimal currentPrice = response.getContent().get(i).getPrice();
            BigDecimal nextPrice = response.getContent().get(i + 1).getPrice();
            assertTrue(currentPrice.compareTo(nextPrice) <= 0,
                    "Giá sau phải lớn hơn hoặc bằng giá trước");
        }
    }

    @Test
    @DisplayName("Test sắp xếp theo giá giảm dần (Sort price DESC)")
    void testSortPriceDescending() {
        ListingFilterRequest filter = new ListingFilterRequest();
        PageRequest pageable = PageRequest.of(0, 10, Sort.by("price").descending());

        PageResponse<ListingResponseDto> response = listingService.searchListings(filter, pageable);

        assertNotNull(response);
        assertTrue(response.getContent().size() >= 3);

        // Kiểm tra thứ tự giảm dần của giá
        for (int i = 0; i < response.getContent().size() - 1; i++) {
            BigDecimal currentPrice = response.getContent().get(i).getPrice();
            BigDecimal nextPrice = response.getContent().get(i + 1).getPrice();
            assertTrue(currentPrice.compareTo(nextPrice) >= 0,
                    "Giá sau phải nhỏ hơn hoặc bằng giá trước");
        }
    }

    @Test
    @DisplayName("Test getListingDtoById trả về chi tiết tin đăng dạng phẳng DTO")
    void testGetListingDtoById() {
        ListingResponseDto dto = listingService.getListingDtoById(listingMidPrice.getId());

        assertNotNull(dto);
        assertEquals(listingMidPrice.getId(), dto.getId());
        assertEquals("Mazda", dto.getBrand());
        assertEquals("3", dto.getModel());
        assertEquals("Luxury", dto.getVariant());
        assertEquals(0, new BigDecimal("600000000").compareTo(dto.getPrice()));
        assertEquals("Đà Nẵng", dto.getLocation());
    }
}
