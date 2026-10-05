package com.system.dto;

import java.math.BigDecimal;
import java.util.List;

public class ChatbotCompareResponse {
    private List<ComparedVehicle> vehicles;
    private Long recommendedListingId;
    private String reason;

    public ChatbotCompareResponse(List<ComparedVehicle> vehicles, Long recommendedListingId, String reason) {
        this.vehicles = vehicles;
        this.recommendedListingId = recommendedListingId;
        this.reason = reason;
    }

    public List<ComparedVehicle> getVehicles() { return vehicles; }
    public Long getRecommendedListingId() { return recommendedListingId; }
    public String getReason() { return reason; }

    public static class ComparedVehicle {
        private ComparisonVehicle vehicle;
        private double score;
        private List<String> advantages;
        private String scoreExplanation;

        public ComparedVehicle(ComparisonVehicle vehicle, double score, List<String> advantages, String scoreExplanation) {
            this.vehicle = vehicle;
            this.score = score;
            this.advantages = advantages;
            this.scoreExplanation = scoreExplanation;
        }

        public ComparisonVehicle getVehicle() { return vehicle; }
        public double getScore() { return score; }
        public List<String> getAdvantages() { return advantages; }
        public String getScoreExplanation() { return scoreExplanation; }
    }

    public static class ComparisonVehicle {
        private Long listingId;
        private Long vehicleId;
        private String title;
        private BigDecimal price;
        private Integer mileage;
        private String fuelType;
        private String transmission;
        private Integer seatCount;
        private String bodyType;
        private Double engineSize;
        private Integer manufactureYear;
        private String origin;
        private String color;
        private Long showroomId;
        private String showroomName;
        private String showroomAddress;
        private String showroomCity;
        private String status;
        private boolean depositEligible;
        private String imageUrl;

        public Long getListingId() { return listingId; }
        public void setListingId(Long listingId) { this.listingId = listingId; }
        public Long getVehicleId() { return vehicleId; }
        public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public Integer getMileage() { return mileage; }
        public void setMileage(Integer mileage) { this.mileage = mileage; }
        public String getFuelType() { return fuelType; }
        public void setFuelType(String fuelType) { this.fuelType = fuelType; }
        public String getTransmission() { return transmission; }
        public void setTransmission(String transmission) { this.transmission = transmission; }
        public Integer getSeatCount() { return seatCount; }
        public void setSeatCount(Integer seatCount) { this.seatCount = seatCount; }
        public String getBodyType() { return bodyType; }
        public void setBodyType(String bodyType) { this.bodyType = bodyType; }
        public Double getEngineSize() { return engineSize; }
        public void setEngineSize(Double engineSize) { this.engineSize = engineSize; }
        public Integer getManufactureYear() { return manufactureYear; }
        public void setManufactureYear(Integer manufactureYear) { this.manufactureYear = manufactureYear; }
        public String getOrigin() { return origin; }
        public void setOrigin(String origin) { this.origin = origin; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public Long getShowroomId() { return showroomId; }
        public void setShowroomId(Long showroomId) { this.showroomId = showroomId; }
        public String getShowroomName() { return showroomName; }
        public void setShowroomName(String showroomName) { this.showroomName = showroomName; }
        public String getShowroomAddress() { return showroomAddress; }
        public void setShowroomAddress(String showroomAddress) { this.showroomAddress = showroomAddress; }
        public String getShowroomCity() { return showroomCity; }
        public void setShowroomCity(String showroomCity) { this.showroomCity = showroomCity; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public boolean isDepositEligible() { return depositEligible; }
        public void setDepositEligible(boolean depositEligible) { this.depositEligible = depositEligible; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }
}
