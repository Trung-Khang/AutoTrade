package com.system.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.system.entity.Listing;
import com.system.entity.Source;
import com.system.entity.Vehicle;

import java.math.BigDecimal;
import java.time.Instant;

public class ListingResponseDto {

    // Thông tin tin đăng (Listing)
    private Long id;
    private BigDecimal price;
    private Integer mileage;
    private String color;
    private String location;
    private String sourceUrl;
    private String imageUrl;
    private String listedAtRaw;
    private Instant listedAt;
    private Instant crawledAt;
    private Instant createdAt;
    private Instant updatedAt;

    // Thông tin dòng xe (Vehicle)
    private Long vehicleId;
    private Long showroomId;
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
    private String status;
    private boolean depositEligible;

    // Thông tin nguồn sàn (Source)
    private Long sourceId;
    private String sourceName;

    public ListingResponseDto() {
    }

    public static ListingResponseDto fromEntity(Listing listing) {
        if (listing == null) {
            return null;
        }

        ListingResponseDto dto = new ListingResponseDto();
        dto.setId(listing.getId());
        dto.setPrice(listing.getPrice());
        dto.setMileage(listing.getMileage());
        dto.setColor(listing.getColor());
        dto.setLocation(listing.getLocation());
        dto.setSourceUrl(listing.getSourceUrl());
        dto.setImageUrl(listing.getImageUrl());
        dto.setListedAtRaw(listing.getListedAtRaw());
        dto.setListedAt(listing.getListedAt());
        dto.setCrawledAt(listing.getCrawledAt());
        dto.setCreatedAt(listing.getCreatedAt());
        dto.setUpdatedAt(listing.getUpdatedAt());

        Vehicle vehicle = listing.getVehicle();
        if (vehicle != null) {
            dto.setVehicleId(vehicle.getId());
            dto.setShowroomId(vehicle.getShowroomId());
            dto.setBrand(vehicle.getBrand());
            dto.setModel(vehicle.getModel());
            dto.setVariant(vehicle.getVariant());
            dto.setManufactureYear(vehicle.getManufactureYear());
            dto.setFuelType(vehicle.getFuelType());
            dto.setTransmission(vehicle.getTransmission());
            dto.setEngineSize(vehicle.getEngineSize());
            dto.setSeatCount(vehicle.getSeatCount());
            dto.setOrigin(vehicle.getOrigin());
            dto.setBodyType(vehicle.getBodyType());
            dto.setStatus(vehicle.getStatus());
            dto.setDepositEligible(
                    vehicle.getShowroomId() != null
                            && "AVAILABLE".equalsIgnoreCase(vehicle.getStatus())
            );
        }

        Source source = listing.getSource();
        if (source != null) {
            dto.setSourceId(source.getId());
            dto.setSourceName(source.getSourceName());
        }

        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getListedAtRaw() { return listedAtRaw; }
    public void setListedAtRaw(String listedAtRaw) { this.listedAtRaw = listedAtRaw; }

    public Instant getListedAt() { return listedAt; }
    public void setListedAt(Instant listedAt) { this.listedAt = listedAt; }

    public Instant getCrawledAt() { return crawledAt; }
    public void setCrawledAt(Instant crawledAt) { this.crawledAt = crawledAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Long getShowroomId() { return showroomId; }
    public void setShowroomId(Long showroomId) { this.showroomId = showroomId; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }

    public Integer getManufactureYear() { return manufactureYear; }
    public void setManufactureYear(Integer manufactureYear) { this.manufactureYear = manufactureYear; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public Double getEngineSize() { return engineSize; }
    public void setEngineSize(Double engineSize) { this.engineSize = engineSize; }

    public Integer getSeatCount() { return seatCount; }
    public void setSeatCount(Integer seatCount) { this.seatCount = seatCount; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isDepositEligible() { return depositEligible; }
    public void setDepositEligible(boolean depositEligible) { this.depositEligible = depositEligible; }

    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    
    @JsonProperty("source_url")
    public String getSourceUrlAlias() { return sourceUrl; }

    @JsonProperty("image_url")
    public String getImageUrlAlias() { return imageUrl; }

    @JsonProperty("listed_at")
    public String getListedAtAlias() { return listedAtRaw != null ? listedAtRaw : (listedAt != null ? listedAt.toString() : null); }

    @JsonProperty("crawled_at")
    public Instant getCrawledAtAlias() { return crawledAt; }

    @JsonProperty("manufacture_year")
    public Integer getManufactureYearAlias() { return manufactureYear; }

    @JsonProperty("fuel_type")
    public String getFuelTypeAlias() { return fuelType; }

    @JsonProperty("engine_size")
    public Double getEngineSizeAlias() { return engineSize; }

    @JsonProperty("seat_count")
    public Integer getSeatCountAlias() { return seatCount; }

    @JsonProperty("body_type")
    public String getBodyTypeAlias() { return bodyType; }

    @JsonProperty("source_name")
    public String getSourceNameAlias() { return sourceName; }
}
