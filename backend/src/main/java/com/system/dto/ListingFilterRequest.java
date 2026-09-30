package com.system.dto;

import java.math.BigDecimal;

public class ListingFilterRequest {

    // Từ khóa tìm kiếm tự do (tìm trong brand, model, variant, location)
    private String keyword;

    // Lọc theo vehicleId nếu có
    private Long vehicleId;

    // Bộ lọc theo phân loại xe
    private String brand;
    private String model;
    private String variant;

    // Khoảng giá (VND)
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    // Khoảng năm sản xuất
    private Integer minYear;
    private Integer maxYear;

    // Khoảng số km đã đi (ODO)
    private Integer minMileage;
    private Integer maxMileage;

    // Thông số kỹ thuật
    private String fuelType;
    private String transmission;
    private String bodyType;
    private String origin;

    // Địa điểm
    private String location;

    public ListingFilterRequest() {
    }

    // Getters & Setters
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }

    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }

    public BigDecimal getMaxPrice() { return maxPrice; }
    public void setMaxPrice(BigDecimal maxPrice) { this.maxPrice = maxPrice; }

    public Integer getMinYear() { return minYear; }
    public void setMinYear(Integer minYear) { this.minYear = minYear; }

    public Integer getMaxYear() { return maxYear; }
    public void setMaxYear(Integer maxYear) { this.maxYear = maxYear; }

    public Integer getMinMileage() { return minMileage; }
    public void setMinMileage(Integer minMileage) { this.minMileage = minMileage; }

    public Integer getMaxMileage() { return maxMileage; }
    public void setMaxMileage(Integer maxMileage) { this.maxMileage = maxMileage; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
