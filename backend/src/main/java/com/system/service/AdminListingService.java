package com.system.service;

import com.system.dto.AdminListingRequest;
import com.system.dto.ListingResponseDto;
import com.system.entity.Listing;
import com.system.entity.Source;
import com.system.entity.Vehicle;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.ListingRepository;
import com.system.repository.SourceRepository;
import com.system.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminListingService {
    private static final Set<String> ALLOWED_STATUSES = Set.of("AVAILABLE", "HOLD", "SOLD");
    private static final String ADMIN_SOURCE = "AutoTrade";

    private final ListingRepository listingRepository;
    private final VehicleRepository vehicleRepository;
    private final SourceRepository sourceRepository;

    public AdminListingService(ListingRepository listingRepository,
                               VehicleRepository vehicleRepository,
                               SourceRepository sourceRepository) {
        this.listingRepository = listingRepository;
        this.vehicleRepository = vehicleRepository;
        this.sourceRepository = sourceRepository;
    }

    @Transactional
    public ListingResponseDto create(AdminListingRequest request) {
        validate(request);

        Vehicle vehicle = new Vehicle();
        applyVehicleFields(vehicle, request);
        vehicle.setVin("ADMIN-" + UUID.randomUUID());
        vehicle.setPrice(request.price());
        vehicle.setMileage(request.mileage());
        vehicle.setColor(blankToNull(request.color()));
        vehicle.setImageUrl(blankToNull(request.imageUrl()));
        vehicle.setStatus(normalizeStatus(request.status()));
        vehicle = vehicleRepository.save(vehicle);

        Source source = sourceRepository.findBySourceName(ADMIN_SOURCE)
                .orElseGet(() -> sourceRepository.save(new Source(ADMIN_SOURCE, "https://autotrade.vn")));

        Listing listing = new Listing(vehicle, source, request.price(), request.mileage(),
                blankToNull(request.location()), "autotrade://admin/" + UUID.randomUUID(),
                blankToNull(request.imageUrl()), Instant.now());
        listing.setColor(blankToNull(request.color()));
        return ListingResponseDto.fromEntity(listingRepository.save(listing));
    }

    @Transactional
    public ListingResponseDto update(Long listingId, AdminListingRequest request) {
        validate(request);
        Listing listing = findListing(listingId);
        Vehicle vehicle = listing.getVehicle();
        if (vehicle == null) {
            throw new ResourceNotFoundException("Tin xe không liên kết với xe nền: " + listingId);
        }

        applyVehicleFields(vehicle, request);
        vehicle.setPrice(request.price());
        vehicle.setMileage(request.mileage());
        vehicle.setColor(blankToNull(request.color()));
        vehicle.setImageUrl(blankToNull(request.imageUrl()));
        vehicle.setStatus(normalizeStatus(request.status()));

        listing.setPrice(request.price());
        listing.setMileage(request.mileage());
        listing.setColor(blankToNull(request.color()));
        listing.setLocation(blankToNull(request.location()));
        listing.setImageUrl(blankToNull(request.imageUrl()));

        vehicleRepository.save(vehicle);
        return ListingResponseDto.fromEntity(listingRepository.save(listing));
    }

    @Transactional
    public ListingResponseDto updateStatus(Long listingId, String status) {
        Listing listing = findListing(listingId);
        Vehicle vehicle = listing.getVehicle();
        if (vehicle == null) {
            throw new ResourceNotFoundException("Tin xe không liên kết với xe nền: " + listingId);
        }
        vehicle.setStatus(normalizeStatus(status));
        vehicleRepository.save(vehicle);
        return ListingResponseDto.fromEntity(listing);
    }

    @Transactional
    public void delete(Long listingId) {
        listingRepository.delete(findListing(listingId));
    }

    private Listing findListing(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin xe với ID: " + listingId));
    }

    private void applyVehicleFields(Vehicle vehicle, AdminListingRequest request) {
        vehicle.setBrand(request.brand().trim());
        vehicle.setModel(request.model().trim());
        vehicle.setVariant(blankToNull(request.variant()));
        vehicle.setManufactureYear(request.manufactureYear());
        vehicle.setFuelType(blankToNull(request.fuelType()));
        vehicle.setTransmission(blankToNull(request.transmission()));
        vehicle.setEngineSize(request.engineSize());
        vehicle.setSeatCount(request.seatCount());
        vehicle.setOrigin(blankToNull(request.origin()));
        vehicle.setBodyType(blankToNull(request.bodyType()));
    }

    private void validate(AdminListingRequest request) {
        if (request == null || isBlank(request.brand()) || isBlank(request.model())) {
            throw new IllegalArgumentException("Hãng xe và dòng xe không được để trống.");
        }
        if (request.manufactureYear() == null || request.manufactureYear() < 1900
                || request.manufactureYear() > 2100) {
            throw new IllegalArgumentException("Năm sản xuất phải nằm trong khoảng 1900-2100.");
        }
        if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá niêm yết phải lớn hơn 0.");
        }
        if (request.mileage() != null && request.mileage() < 0) {
            throw new IllegalArgumentException("Số km đã đi không được âm.");
        }
        normalizeStatus(request.status());
    }

    private String normalizeStatus(String status) {
        String normalized = isBlank(status) ? "AVAILABLE" : status.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Trạng thái phải là AVAILABLE, HOLD hoặc SOLD.");
        }
        return normalized;
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
