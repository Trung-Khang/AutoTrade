package com.system.controller;

import com.system.dto.ListingFilterRequest;
import com.system.dto.ListingResponseDto;
import com.system.dto.PageResponse;
import com.system.entity.Listing;
import com.system.service.ListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/listings")
@Tag(name = "2. Listing API", description = "Các API quản lý tin đăng rao bán xe trên thị trường")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    //GET: Lấy danh sách tin đăng có tìm kiếm, lọc, phân trang và sắp xếp
    @GetMapping
    @Operation(summary = "Tìm kiếm & Lọc tin đăng xe",
               description = "Tìm kiếm và lọc tin đăng theo nhiều tiêu chí (hãng, dòng xe, khoảng giá, năm sản xuất, ODO, nhiên liệu...), hỗ trợ phân trang (page, size) và sắp xếp (sort=price,asc...)")
    public ResponseEntity<PageResponse<ListingResponseDto>> getAllListings(
            @ParameterObject ListingFilterRequest filter,
            @ParameterObject @PageableDefault(page = 0, size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ListingResponseDto> response = listingService.searchListings(filter, pageable);
        return ResponseEntity.ok(response);
    }

    //GET /{id}: Lấy chi tiết tin đăng theo ID
    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết tin đăng theo ID", description = "Nhận vào ID tin đăng và trả về thông tin chi tiết kèm thông số xe dạng phẳng DTO")
    public ResponseEntity<ListingResponseDto> getListingById(@PathVariable Long id) {
        ListingResponseDto dto = listingService.getListingDtoById(id);
        return ResponseEntity.ok(dto);
    }

    //POST: Thêm mới một tin đăng bán xe
    @PostMapping
    @Operation(summary = "Tạo mới tin đăng xe", description = "Nhận thông tin tin đăng từ người dùng/crawler và lưu vào Database")
    public ResponseEntity<Listing> createListing(@RequestBody Listing listing) {
        Listing createdListing = listingService.createListing(listing);
        return new ResponseEntity<>(createdListing, HttpStatus.CREATED);
    }

    //DELETE /{id}: Xóa một tin đăng theo ID
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa một tin đăng theo ID", description = "Xóa bài đăng rao bán khỏi hệ thống theo ID chỉ định")
    public ResponseEntity<String> deleteListing(@PathVariable Long id) {
        listingService.deleteListing(id);
        return ResponseEntity.ok("Da xoa thanh cong tin dang voi ID: " + id);
    }
}
