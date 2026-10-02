package com.system.controller;

import com.system.dto.AdminListingRequest;
import com.system.dto.ListingFilterRequest;
import com.system.dto.ListingResponseDto;
import com.system.dto.PageResponse;
import com.system.service.AdminListingService;
import com.system.service.ListingService;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/listings")
public class AdminListingController {
    private final ListingService listingService;
    private final AdminListingService adminListingService;

    public AdminListingController(ListingService listingService, AdminListingService adminListingService) {
        this.listingService = listingService;
        this.adminListingService = adminListingService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ListingResponseDto>> getListings(
            @ParameterObject ListingFilterRequest filter,
            @ParameterObject @PageableDefault(page = 0, size = 20, sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(listingService.searchListings(filter, pageable));
    }

    @PostMapping
    public ResponseEntity<ListingResponseDto> create(@RequestBody AdminListingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminListingService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ListingResponseDto> update(@PathVariable Long id,
                                                      @RequestBody AdminListingRequest request) {
        return ResponseEntity.ok(adminListingService.update(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ListingResponseDto> updateStatus(@PathVariable Long id,
                                                            @RequestParam String status) {
        return ResponseEntity.ok(adminListingService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adminListingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
