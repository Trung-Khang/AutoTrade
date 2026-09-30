package com.system.service;

import com.system.dto.ListingFilterRequest;
import com.system.dto.ListingResponseDto;
import com.system.dto.PageResponse;
import com.system.entity.Listing;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.ListingRepository;
import com.system.repository.VehicleRepository;
import com.system.specification.ListingSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final VehicleRepository vehicleRepository;

    public ListingService(ListingRepository listingRepository, VehicleRepository vehicleRepository) {
        this.listingRepository = listingRepository;
        this.vehicleRepository = vehicleRepository;
    }

    /**
     * Tìm kiếm và lọc tin đăng xe đa tiêu chí, hỗ trợ phân trang và sắp xếp.
     * Trả về kết quả phân trang ở dạng DTO phẳng cho Frontend.
     */
    public PageResponse<ListingResponseDto> searchListings(ListingFilterRequest filter, Pageable pageable) {
        Specification<Listing> spec = ListingSpecification.filterBy(filter);
        Page<Listing> pageResult = listingRepository.findAll(spec, pageable);
        Page<ListingResponseDto> dtoPage = pageResult.map(ListingResponseDto::fromEntity);
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Lấy chi tiết một tin đăng dưới dạng DTO phẳng kèm thông số dòng xe và nguồn.
     */
    public ListingResponseDto getListingDtoById(Long id) {
        Listing listing = getListingById(id);
        return ListingResponseDto.fromEntity(listing);
    }

    //Lấy toàn bộ danh sách tin đăng rao bán xe (Legacy)
    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }
    //Lấy chi tiết một tin đăng theo ID
    public Listing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tin dang voi ID: " + id));
    }
    //Thêm mới một tin đăng bán xe
    public Listing createListing(Listing listing) {
        // Kiểm tra xem dòng xe (Vehicle) liên kết có tồn tại hay không
        if (listing.getVehicle() != null && listing.getVehicle().getId() != null) {
            vehicleRepository.findById(listing.getVehicle().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Khong tim thay dong xe voi ID: " + listing.getVehicle().getId()));
        }
        return listingRepository.save(listing);
    }
    //Xóa tin đăng theo ID
    public void deleteListing(Long id) {
        Listing listing = getListingById(id);
        listingRepository.delete(listing);
    }

    //Lấy danh sách tin đăng theo dòng xe
    public List<Listing> getListingsByVehicleId(Long vehicleId) {
        return listingRepository.findByVehicleId(vehicleId);
    }
}
