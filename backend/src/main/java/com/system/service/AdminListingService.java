package com.system.service;

import com.system.dto.AdminListingRequest;
import com.system.dto.ListingResponseDto;
import com.system.entity.Listing;
import com.system.entity.Showroom;
import com.system.entity.Source;
import com.system.entity.Vehicle;
import com.system.exception.ResourceNotFoundException;
import com.system.exception.AuthException;
import com.system.repository.ListingRepository;
import com.system.repository.AppointmentRepository;
import com.system.repository.DepositRepository;
import com.system.repository.SourceRepository;
import com.system.repository.ShowroomRepository;
import com.system.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.Collection;

@Service
public class AdminListingService {
    private static final Set<String> ALLOWED_STATUSES = Set.of("AVAILABLE", "HOLD", "SOLD");
    private static final String ADMIN_SOURCE = "AutoTrade";

    private final ListingRepository listingRepository;
    private final VehicleRepository vehicleRepository;
    private final SourceRepository sourceRepository;
    private final ShowroomRepository showroomRepository;
    private final DepositRepository depositRepository;
    private final AppointmentRepository appointmentRepository;

    public AdminListingService(ListingRepository listingRepository,
                               VehicleRepository vehicleRepository,
                               SourceRepository sourceRepository,
                               ShowroomRepository showroomRepository,
                               DepositRepository depositRepository,
                               AppointmentRepository appointmentRepository) {
        this.listingRepository = listingRepository;
        this.vehicleRepository = vehicleRepository;
        this.sourceRepository = sourceRepository;
        this.showroomRepository = showroomRepository;
        this.depositRepository = depositRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional
    public ListingResponseDto create(AdminListingRequest request) {
        validate(request);
        Showroom showroom = resolveShowroom(request.showroomId());

        Vehicle vehicle = new Vehicle();
        applyVehicleFields(vehicle, request);
        vehicle.setVin("ADMIN-" + UUID.randomUUID());
        vehicle.setPrice(request.price());
        vehicle.setMileage(request.mileage());
        vehicle.setColor(blankToNull(request.color()));
        vehicle.setImageUrl(blankToNull(request.imageUrl()));
        vehicle.setShowroomId(request.showroomId());
        vehicle.setStatus(normalizeStatus(request.status()));
        vehicle = vehicleRepository.save(vehicle);

        Source source = sourceRepository.findBySourceName(ADMIN_SOURCE)
                .orElseGet(() -> sourceRepository.save(new Source(ADMIN_SOURCE, "https://autotrade.vn")));

        Listing listing = new Listing(vehicle, source, request.price(), request.mileage(),
                resolveLocation(showroom, request.location()), "autotrade://admin/" + UUID.randomUUID(),
                blankToNull(request.imageUrl()), Instant.now());
        listing.setColor(blankToNull(request.color()));
        return ListingResponseDto.fromEntity(listingRepository.save(listing));
    }

    @Transactional
    public ListingResponseDto update(Long listingId, AdminListingRequest request) {
        validate(request);
        Listing listing = findListing(listingId);
        Vehicle listingVehicle = listing.getVehicle();
        if (listingVehicle == null) {
            throw new ResourceNotFoundException("Tin xe không liên kết với xe nền: " + listingId);
        }
        Vehicle vehicle = vehicleRepository.findLockedById(listingVehicle.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy xe với ID: " + listingVehicle.getId()));
        Showroom showroom = request.showroomId() != null
                ? resolveShowroom(request.showroomId())
                : resolveShowroom(vehicle.getShowroomId());

        applyVehicleFields(vehicle, request);
        vehicle.setPrice(request.price());
        vehicle.setMileage(request.mileage());
        vehicle.setColor(blankToNull(request.color()));
        vehicle.setImageUrl(blankToNull(request.imageUrl()));
        if (request.showroomId() != null) {
            vehicle.setShowroomId(request.showroomId());
        }
        String nextStatus = normalizeStatus(request.status());
        if ("AVAILABLE".equals(nextStatus)) {
            assertCanReopen(vehicle.getId());
        }
        vehicle.setStatus(nextStatus);

        listing.setPrice(request.price());
        listing.setMileage(request.mileage());
        listing.setColor(blankToNull(request.color()));
        listing.setLocation(resolveLocation(showroom, request.location()));
        listing.setImageUrl(blankToNull(request.imageUrl()));

        vehicleRepository.save(vehicle);
        return ListingResponseDto.fromEntity(listingRepository.save(listing));
    }

    @Transactional
    public ListingResponseDto updateStatus(Long listingId, String status) {
        Listing listing = findListing(listingId);
        Vehicle listingVehicle = listing.getVehicle();
        if (listingVehicle == null) {
            throw new ResourceNotFoundException("Tin xe không liên kết với xe nền: " + listingId);
        }
        Vehicle vehicle = vehicleRepository.findLockedById(listingVehicle.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy xe với ID: " + listingVehicle.getId()));
        String nextStatus = normalizeStatus(status);
        if ("AVAILABLE".equals(nextStatus)) {
            assertCanReopen(vehicle.getId());
        }
        vehicle.setStatus(nextStatus);
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
        resolveShowroom(request.showroomId());
        normalizeStatus(request.status());
    }

    private Showroom resolveShowroom(Long showroomId) {
        if (showroomId == null) return null;
        return showroomRepository.findById(showroomId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy showroom với ID: " + showroomId));
    }

    private String resolveLocation(Showroom showroom, String requestedLocation) {
        if (showroom == null) return blankToNull(requestedLocation);
        return !isBlank(showroom.getCity()) ? showroom.getCity().trim() : blankToNull(showroom.getName());
    }

    private String normalizeStatus(String status) {
        String normalized = isBlank(status) ? "AVAILABLE" : status.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Trạng thái phải là AVAILABLE, HOLD hoặc SOLD.");
        }
        return normalized;
    }

    private void assertCanReopen(Long vehicleId) {
        Collection<String> activeDepositStatuses = Set.of("PENDING", "DEPOSITED");
        Collection<String> activeAppointmentStatuses = Set.of("PENDING", "SCHEDULED");
        if (depositRepository.existsByVehicleIdAndStatusIn(vehicleId, activeDepositStatuses)
                || appointmentRepository.existsByVehicleIdAndStatusIn(vehicleId, activeAppointmentStatuses)) {
            throw new AuthException(org.springframework.http.HttpStatus.CONFLICT,
                    "Xe đang có đơn đặt cọc hoặc lịch hẹn hiệu lực. Vui lòng hủy lịch và hoàn cọc trước khi mở bán lại.");
        }
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
