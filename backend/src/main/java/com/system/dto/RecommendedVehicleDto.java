package com.system.dto;

import java.math.BigDecimal;

public class RecommendedVehicleDto {
    private Long id;
    private String title;
    private BigDecimal price;
    private String bodyType;
    private Integer seatCount;
    private String fuelType;
    private String transmission;
    private String imageUrl;
    private String showroomName;
    private String showroomCity;

    public RecommendedVehicleDto() {}

    public RecommendedVehicleDto(Long id, String title, BigDecimal price, String bodyType,
                                 Integer seatCount, String fuelType, String transmission,
                                 String imageUrl, String showroomName, String showroomCity) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.bodyType = bodyType;
        this.seatCount = seatCount;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.imageUrl = imageUrl;
        this.showroomName = showroomName;
        this.showroomCity = showroomCity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getBodyType() {
        return bodyType;
    }

    public void setBodyType(String bodyType) {
        this.bodyType = bodyType;
    }

    public Integer getSeatCount() {
        return seatCount;
    }

    public void setSeatCount(Integer seatCount) {
        this.seatCount = seatCount;
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getShowroomName() {
        return showroomName;
    }

    public void setShowroomName(String showroomName) {
        this.showroomName = showroomName;
    }

    public String getShowroomCity() {
        return showroomCity;
    }

    public void setShowroomCity(String showroomCity) {
        this.showroomCity = showroomCity;
    }
}
