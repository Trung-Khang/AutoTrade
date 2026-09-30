package com.system.dto;

import com.system.entity.Showroom;
import com.system.entity.Vehicle;

import java.math.BigDecimal;
import java.time.Instant;

public class VehicleResponse {

    private Long id;
    private String vin;
    private String brand;
    private String model;
    private String variant;
    private Integer manufactureYear;
    private String fuelType;
    private String transmission;
    private Double engineSize;
    private Integer seatCount;
    private String origin;
    private String bodyType;
    private BigDecimal price;
    private Integer mileage;
    private String color;
    private String imageUrl;
    private String description;
    private String status;
    private Showroom showroom;
    private Instant createdAt;

    public VehicleResponse() {
    }

    public VehicleResponse(Vehicle v, Showroom s) {
        this.id = v.getId();
        this.vin = v.getVin();
        this.brand = v.getBrand();
        this.model = v.getModel();
        this.variant = v.getVariant();
        this.manufactureYear = v.getManufactureYear();
        this.fuelType = v.getFuelType();
        this.transmission = v.getTransmission();
        this.engineSize = v.getEngineSize();
        this.seatCount = v.getSeatCount();
        this.origin = v.getOrigin();
        this.bodyType = v.getBodyType();
        this.price = v.getPrice();
        this.mileage = v.getMileage();
        this.color = v.getColor();
        this.imageUrl = v.getImageUrl();
        this.description = v.getDescription();
        this.status = v.getStatus();
        this.showroom = s;
        this.createdAt = v.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getVariant() {
        return variant;
    }

    public void setVariant(String variant) {
        this.variant = variant;
    }

    public Integer getManufactureYear() {
        return manufactureYear;
    }

    public void setManufactureYear(Integer manufactureYear) {
        this.manufactureYear = manufactureYear;
    }

    public String getFuelType() {
        return fuelType;
    }

    public void setFuelType(String fuelType) {
        this.fuelType = fuelType;
    }

    public String getTransmission() {
        return transmission;
    }

    public void setTransmission(String transmission) {
        this.transmission = transmission;
    }

    public Double getEngineSize() {
        return engineSize;
    }

    public void setEngineSize(Double engineSize) {
        this.engineSize = engineSize;
    }

    public Integer getSeatCount() {
        return seatCount;
    }

    public void setSeatCount(Integer seatCount) {
        this.seatCount = seatCount;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getBodyType() {
        return bodyType;
    }

    public void setBodyType(String bodyType) {
        this.bodyType = bodyType;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getMileage() {
        return mileage;
    }

    public void setMileage(Integer mileage) {
        this.mileage = mileage;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Showroom getShowroom() {
        return showroom;
    }

    public void setShowroom(Showroom showroom) {
        this.showroom = showroom;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
