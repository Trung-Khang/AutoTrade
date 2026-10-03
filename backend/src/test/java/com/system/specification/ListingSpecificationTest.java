package com.system.specification;

import com.system.dto.ListingFilterRequest;
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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional // Tự động Rollback sau mỗi test case, không làm biến đổi CSDL thật
class ListingSpecificationTest {

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private SourceRepository sourceRepository;

    private Vehicle vios;
    private Vehicle crv;
    private Vehicle vf3;
    private Source source;

    @BeforeEach
    void setUp() {
        source = sourceRepository.save(new Source("test-source-" + System.currentTimeMillis(), "https://test.com"));

        vios = vehicleRepository.save(new Vehicle("Toyota", "Vios", "1.5G", 2021, "Gasoline", "Automatic", 1.5, 5, "Domestic", "Sedan"));
        crv = vehicleRepository.save(new Vehicle("Honda", "CR-V", "1.5L", 2023, "Gasoline", "CVT", 1.5, 7, "Imported", "SUV / Crossover"));
        vf3 = vehicleRepository.save(new Vehicle("VinFast", "VF 3", "Base", 2024, "Electric", "Automatic", null, 4, "Domestic", "SUV / Crossover"));

        // Listing 1: Vios 480tr, 40000km, TP.HCM
        listingRepository.save(new Listing(vios, source, new BigDecimal("480000000"), 40000, "TP. Hồ Chí Minh",
                "https://test.com/vios-" + System.currentTimeMillis(), null, Instant.now()));

        // Listing 2: CR-V 950tr, 15000km, Hà Nội
        listingRepository.save(new Listing(crv, source, new BigDecimal("950000000"), 15000, "Hà Nội",
                "https://test.com/crv-" + System.currentTimeMillis(), null, Instant.now()));

        // Listing 3: VF 3 240tr, 5000km, Đà Nẵng
        listingRepository.save(new Listing(vf3, source, new BigDecimal("240000000"), 5000, "Đà Nẵng",
                "https://test.com/vf3-" + System.currentTimeMillis(), null, Instant.now()));
    }

    @Test
    @DisplayName("Test lọc tin đăng theo Hãng xe (Brand)")
    void testFilterByBrand() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota");

        Specification<Listing> spec = ListingSpecification.filterBy(filter);
        List<Listing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals("Vios", results.get(0).getVehicle().getModel());
    }

    @Test
    @DisplayName("Test lọc tin đăng theo Khoảng giá (minPrice, maxPrice)")
    void testFilterByPriceRange() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setMinPrice(new BigDecimal("400000000"));
        filter.setMaxPrice(new BigDecimal("600000000"));

        Specification<Listing> spec = ListingSpecification.filterBy(filter);
        List<Listing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(0, new BigDecimal("480000000").compareTo(results.get(0).getPrice()));
    }

    @Test
    @DisplayName("Test lọc tin đăng theo Nhiên liệu (FuelType: Electric)")
    void testFilterByFuelType() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setFuelType("Electric");

        Specification<Listing> spec = ListingSpecification.filterBy(filter);
        List<Listing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals("VinFast", results.get(0).getVehicle().getBrand());
    }

    @Test
    @DisplayName("Test tìm kiếm từ khóa đa trường (Keyword: 'Hồ Chí Minh')")
    void testFilterByKeyword() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setKeyword("Hồ Chí Minh");

        Specification<Listing> spec = ListingSpecification.filterBy(filter);
        List<Listing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals("Toyota", results.get(0).getVehicle().getBrand());
    }

    @Test
    @DisplayName("Test lọc kết hợp nhiều điều kiện (Brand + Price + Year)")
    void testFilterCombined() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Honda");
        filter.setMinPrice(new BigDecimal("800000000"));
        filter.setMinYear(2022);

        Specification<Listing> spec = ListingSpecification.filterBy(filter);
        List<Listing> results = listingRepository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals("CR-V", results.get(0).getVehicle().getModel());
    }

    @Test
    @DisplayName("Kho xe lọc chính xác trạng thái AVAILABLE và HOLD")
    void testFilterByAdminStatus() {
        vios.setStatus("AVAILABLE");
        crv.setStatus("HOLD");
        vf3.setStatus("SOLD");
        vehicleRepository.saveAll(List.of(vios, crv, vf3));

        ListingFilterRequest availableFilter = new ListingFilterRequest();
        availableFilter.setStatus("AVAILABLE");
        List<Listing> available = listingRepository.findAll(ListingSpecification.filterBy(availableFilter));

        ListingFilterRequest holdFilter = new ListingFilterRequest();
        holdFilter.setStatus("HOLD");
        List<Listing> held = listingRepository.findAll(ListingSpecification.filterBy(holdFilter));

        assertEquals(1, available.size());
        assertEquals("Vios", available.get(0).getVehicle().getModel());
        assertEquals(1, held.size());
        assertEquals("CR-V", held.get(0).getVehicle().getModel());
    }

    @Test
    @DisplayName("Kho xe lọc theo showroomId thật, không theo location text")
    void testFilterByShowroomId() {
        vios.setShowroomId(1L);
        crv.setShowroomId(2L);
        vehicleRepository.saveAll(List.of(vios, crv));

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setShowroomId(1L);
        List<Listing> results = listingRepository.findAll(ListingSpecification.filterBy(filter));

        assertEquals(1, results.size());
        assertEquals("Vios", results.get(0).getVehicle().getModel());
    }

    @Test
    @DisplayName("Xe chưa gán showroom không được tính là đủ điều kiện đặt cọc")
    void testDepositEligibleRequiresShowroomAndAvailableStatus() {
        vios.setShowroomId(1L);
        vios.setStatus("AVAILABLE");
        crv.setShowroomId(2L);
        crv.setStatus("HOLD");
        vehicleRepository.saveAll(List.of(vios, crv));

        ListingFilterRequest eligibleFilter = new ListingFilterRequest();
        eligibleFilter.setDepositEligible(true);
        List<Listing> eligible = listingRepository.findAll(ListingSpecification.filterBy(eligibleFilter));
        assertEquals(1, eligible.size());
        assertEquals("Vios", eligible.get(0).getVehicle().getModel());

        ListingFilterRequest unassignedFilter = new ListingFilterRequest();
        unassignedFilter.setShowroomUnassigned(true);
        List<Listing> unassigned = listingRepository.findAll(ListingSpecification.filterBy(unassignedFilter));
        assertEquals(1, unassigned.size());
        assertEquals("VF 3", unassigned.get(0).getVehicle().getModel());
    }
}
