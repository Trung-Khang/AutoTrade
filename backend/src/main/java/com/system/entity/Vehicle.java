package com.system.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Số khung xe (VIN - Vehicle Identification Number): Định danh độc bản duy nhất của xe cũ
    @Column(name = "vin", unique = true, length = 50)
    private String vin;

    @Column(name = "brand", nullable = false, length = 50)
    private String brand;

    @Column(name = "model", nullable = false, length = 50)
    private String model;

    @Column(name = "variant", length = 100)
    private String variant;

    @Column(name = "manufacture_year", nullable = false)
    private Integer manufactureYear;

    @Column(name = "fuel_type", length = 30)
    private String fuelType;

    @Column(name = "transmission", length = 30)
    private String transmission;

    // Trường Enrich: Dung tích xi lanh (L)
    @Column(name = "engine_size")
    private Double engineSize;

    // Trường Enrich: Số chỗ ngồi
    @Column(name = "seat_count")
    private Integer seatCount;

    // Trường Enrich: Xuất xứ (Lắp ráp trong nước / Nhập khẩu)
    @Column(name = "origin", length = 50)
    private String origin;

    @Column(name = "body_type", length = 50)
    private String bodyType;

    // Giá bán niêm yết tại Showroom (VND)
    @Column(name = "price", precision = 15, scale = 2)
    private BigDecimal price;

    // Số km đã đi (ODO)
    @Column(name = "mileage")
    private Integer mileage;

    // Màu sơn ngoại thất
    @Column(name = "color", length = 50)
    private String color;

    // Đường dẫn ảnh đại diện
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Mô tả tình trạng xe và trang bị
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Trạng thái độc bản: AVAILABLE (Sẵn sàng bán), HOLD (Đang giữ cọc), RESERVED (Đang làm HĐ), SOLD (Đã bán)
    @Column(name = "status", nullable = false, length = 20)
    private String status = "AVAILABLE";

    // Khóa ngoại liên kết Showroom trưng bày xe
    @Column(name = "showroom_id")
    private Long showroomId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Vehicle() {
    }

    public Vehicle(String brand, String model, String variant, Integer manufactureYear, 
                   String bodyType, String fuelType, String transmission) {
        this.brand = brand;
        this.model = model;
        this.variant = variant;
        this.manufactureYear = manufactureYear;
        this.bodyType = bodyType;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.status = "AVAILABLE";
        this.createdAt = Instant.now();
    }

    public Vehicle(String brand, String model, String variant, Integer manufactureYear, 
                   String fuelType, String transmission, Double engineSize, 
                   Integer seatCount, String origin, String bodyType) {
        this.brand = brand;
        this.model = model;
        this.variant = variant;
        this.manufactureYear = manufactureYear;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.engineSize = engineSize;
        this.seatCount = seatCount;
        this.origin = origin;
        this.bodyType = bodyType;
        this.status = "AVAILABLE";
        this.createdAt = Instant.now();
    }

    public Vehicle(String vin, String brand, String model, String variant, Integer manufactureYear, 
                   String fuelType, String transmission, Double engineSize, Integer seatCount, 
                   String origin, String bodyType, BigDecimal price, Integer mileage, 
                   String color, String imageUrl, Long showroomId, String description) {
        this.vin = vin;
        this.brand = brand;
        this.model = model;
        this.variant = variant;
        this.manufactureYear = manufactureYear;
        this.fuelType = fuelType;
        this.transmission = transmission;
        this.engineSize = engineSize;
        this.seatCount = seatCount;
        this.origin = origin;
        this.bodyType = bodyType;
        this.price = price;
        this.mileage = mileage;
        this.color = color;
        this.imageUrl = imageUrl;
        this.showroomId = showroomId;
        this.description = description;
        this.status = "AVAILABLE";
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "AVAILABLE";
        }
    }

    // ---------------------------------------------------------------
    // GETTERS & SETTERS
    // ---------------------------------------------------------------
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

    public Long getShowroomId() {
        return showroomId;
    }

    public void setShowroomId(Long showroomId) {
        this.showroomId = showroomId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
