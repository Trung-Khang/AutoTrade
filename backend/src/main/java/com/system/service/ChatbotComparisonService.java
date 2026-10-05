package com.system.service;

import com.system.dto.ChatbotCompareRequest;
import com.system.dto.ChatbotCompareResponse;
import com.system.entity.Listing;
import com.system.entity.Showroom;
import com.system.entity.Vehicle;
import com.system.exception.ResourceNotFoundException;
import com.system.repository.ListingRepository;
import com.system.repository.ShowroomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatbotComparisonService {
    private final ListingRepository listingRepository;
    private final ShowroomRepository showroomRepository;

    public ChatbotComparisonService(ListingRepository listingRepository, ShowroomRepository showroomRepository) {
        this.listingRepository = listingRepository;
        this.showroomRepository = showroomRepository;
    }

    @Transactional(readOnly = true)
    public ChatbotCompareResponse compare(ChatbotCompareRequest request) {
        if (request == null || request.getListingIds() == null
                || request.getListingIds().size() != 2) {
            throw new IllegalArgumentException("Vui lòng chọn đúng 2 xe để so sánh.");
        }
        if (request.getListingIds().stream().anyMatch(id -> id == null)
                || request.getListingIds().stream().distinct().count() != request.getListingIds().size()) {
            throw new IllegalArgumentException("Danh sách xe so sánh không hợp lệ hoặc có xe bị trùng.");
        }

        List<ChatbotCompareResponse.ComparisonVehicle> vehicles = request.getListingIds().stream()
                .map(id -> listingRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng xe: " + id)))
                .map(this::toVehicle)
                .collect(Collectors.toList());

        List<ScoreResult> scores = vehicles.stream()
                .map(vehicle -> score(vehicle, vehicles, request.getPurpose()))
                .collect(Collectors.toList());
        double bestScore = scores.stream().map(ScoreResult::value).max(Double::compareTo).orElse(0.0);
        int bestIndex = 0;
        for (int i = 1; i < scores.size(); i++) {
            if (scores.get(i).value() > scores.get(bestIndex).value()) bestIndex = i;
        }
        Long recommendedId = bestScore > 0 ? vehicles.get(bestIndex).getListingId() : null;

        List<ChatbotCompareResponse.ComparedVehicle> compared = new ArrayList<>();
        for (int i = 0; i < vehicles.size(); i++) {
            compared.add(new ChatbotCompareResponse.ComparedVehicle(
                    vehicles.get(i), scores.get(i).value(), buildAdvantages(vehicles.get(i), vehicles, request.getPurpose()), scores.get(i).explanation()));
        }
        String reason = recommendedId == null
                ? "Chưa đủ thông tin nhu cầu để xác định xe phù hợp hơn."
                : vehicles.get(bestIndex).getTitle() + " có điểm phù hợp cao nhất theo dữ liệu đã chọn ("
                + String.format(Locale.ROOT, "%.1f", bestScore) + "/100).";
        return new ChatbotCompareResponse(compared, recommendedId, reason);
    }

    private ChatbotCompareResponse.ComparisonVehicle toVehicle(Listing listing) {
        Vehicle vehicle = listing.getVehicle();
        if (vehicle == null) throw new ResourceNotFoundException("Tin đăng không có thông tin xe.");
        ChatbotCompareResponse.ComparisonVehicle result = new ChatbotCompareResponse.ComparisonVehicle();
        result.setListingId(listing.getId());
        result.setVehicleId(vehicle.getId());
        result.setTitle(joinTitle(vehicle));
        result.setPrice(listing.getPrice() != null ? listing.getPrice() : vehicle.getPrice());
        result.setMileage(listing.getMileage() != null ? listing.getMileage() : vehicle.getMileage());
        result.setFuelType(vehicle.getFuelType());
        result.setTransmission(vehicle.getTransmission());
        result.setSeatCount(vehicle.getSeatCount());
        result.setBodyType(vehicle.getBodyType());
        result.setEngineSize(vehicle.getEngineSize());
        result.setManufactureYear(vehicle.getManufactureYear());
        result.setOrigin(vehicle.getOrigin());
        result.setColor(listing.getColor() != null ? listing.getColor() : vehicle.getColor());
        result.setShowroomId(vehicle.getShowroomId());
        result.setStatus(vehicle.getStatus());
        result.setImageUrl(listing.getImageUrl() != null ? listing.getImageUrl() : vehicle.getImageUrl());
        if (vehicle.getShowroomId() != null) {
            showroomRepository.findById(vehicle.getShowroomId()).ifPresent(showroom -> applyShowroom(result, showroom));
        }
        result.setDepositEligible("AVAILABLE".equalsIgnoreCase(vehicle.getStatus()) && vehicle.getShowroomId() != null);
        return result;
    }

    private void applyShowroom(ChatbotCompareResponse.ComparisonVehicle result, Showroom showroom) {
        result.setShowroomName(showroom.getName());
        result.setShowroomAddress(showroom.getAddress());
        result.setShowroomCity(showroom.getCity());
    }

    private String joinTitle(Vehicle vehicle) {
        return String.join(" ", value(vehicle.getBrand()), value(vehicle.getModel()), value(vehicle.getVariant())).trim();
    }

    private String value(String value) { return value == null ? "" : value.trim(); }

    private ScoreResult score(ChatbotCompareResponse.ComparisonVehicle vehicle,
                              List<ChatbotCompareResponse.ComparisonVehicle> all, String rawPurpose) {
        String purpose = rawPurpose == null ? "" : rawPurpose.toLowerCase(Locale.ROOT);
        double purposeScore = 0;
        boolean hasPurpose = !purpose.isBlank();

        if (purpose.contains("sang") || purpose.contains("cao cấp") || purpose.contains("cao cap")
                || purpose.contains("doanh nhân") || purpose.contains("doanh nhan") || purpose.contains("luxury")) {
            purposeScore += containsAny(vehicle.getTitle(), "mercedes", "bmw", "audi", "lexus", "porsche", "s class") ? 20 : 4;
        } else if (purpose.contains("gia đình") || purpose.contains("gia dinh") || purpose.contains("family")) {
            purposeScore += vehicle.getSeatCount() == null ? 0 : vehicle.getSeatCount() >= 7 ? 12 : vehicle.getSeatCount() >= 5 ? 7 : 0;
            purposeScore += containsAny(vehicle.getBodyType(), "suv", "mpv", "van") ? 5 : 0;
            purposeScore += containsAny(vehicle.getTransmission(), "tự động", "automatic", "auto") ? 3 : 0;
        } else if (purpose.contains("phố") || purpose.contains("pho") || purpose.contains("city")) {
            purposeScore += containsAny(vehicle.getBodyType(), "sedan", "hatchback") ? 12 : 4;
            purposeScore += containsAny(vehicle.getTransmission(), "tự động", "automatic", "auto") ? 5 : 0;
        } else if (purpose.contains("phượt") || purpose.contains("phuot") || purpose.contains("đồi")
                || purpose.contains("đèo") || purpose.contains("suv")) {
            purposeScore += containsAny(vehicle.getBodyType(), "suv", "crossover", "pickup") ? 15 : 2;
        } else if (purpose.contains("điện") || purpose.contains("dien") || purpose.contains("electric")) {
            purposeScore += containsAny(vehicle.getFuelType(), "điện", "dien", "electric") ? 20 : 0;
        } else if (hasPurpose) {
            purposeScore += 4;
        }

        // These are objective relative factors, so otherwise similar cars do not get an artificial tie.
        BigDecimal targetBudget = extractBudget(rawPurpose);
        double priceScore = targetBudget != null
                ? budgetScore(vehicle.getPrice(), targetBudget)
                : relativeScore(vehicle.getPrice(), all.stream().map(ChatbotCompareResponse.ComparisonVehicle::getPrice).toList(), false, 5);
        double mileageScore = relativeScore(vehicle.getMileage(), all.stream().map(ChatbotCompareResponse.ComparisonVehicle::getMileage).toList(), true, 5);
        double yearScore = relativeScore(vehicle.getManufactureYear(), all.stream().map(ChatbotCompareResponse.ComparisonVehicle::getManufactureYear).toList(), false, 5);
        double showroomScore = vehicle.isDepositEligible() ? 5 : 0;
        double normalizedScore = Math.min(100, 60 + purposeScore + priceScore + mileageScore + yearScore + showroomScore);
        String explanation = String.format(Locale.ROOT,
                "Điểm cơ sở 60; mục đích/kiểu dáng %.1f/20; mức phù hợp tài chính/phân khúc %.1f/5; số km %.1f/5; đời xe %.1f/5; showroom hợp lệ %.1f/5. Tổng %.1f/100.",
                purposeScore, priceScore, mileageScore, yearScore, showroomScore, normalizedScore);
        return new ScoreResult(normalizedScore, explanation);
    }

    private BigDecimal extractBudget(String rawPurpose) {
        if (rawPurpose == null) return null;
        Matcher matcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(triệu|tr|tỷ|ty)", Pattern.CASE_INSENSITIVE)
                .matcher(rawPurpose.toLowerCase(Locale.ROOT));
        if (!matcher.find()) return null;
        BigDecimal value = new BigDecimal(matcher.group(1).replace(',', '.'));
        return matcher.group(2).startsWith("t") && !matcher.group(2).startsWith("tr")
                ? value.multiply(BigDecimal.valueOf(1_000_000_000L))
                : value.multiply(BigDecimal.valueOf(1_000_000L));
    }

    private double budgetScore(BigDecimal price, BigDecimal targetBudget) {
        if (price == null || targetBudget == null || targetBudget.signum() <= 0) return 0.0;
        double distance = price.subtract(targetBudget).abs().doubleValue() / targetBudget.doubleValue();
        return Math.max(0.0, 5.0 - Math.min(5.0, distance * 10.0));
    }

    private record ScoreResult(double value, String explanation) { }

    private <T extends Comparable<T>> double relativeScore(T value, List<T> values, boolean lowerIsBetter, double weight) {
        if (value == null) return 0.0;
        List<T> known = values.stream().filter(v -> v != null).sorted().toList();
        if (known.size() < 2 || known.get(0).equals(known.get(known.size() - 1))) return 0.0;
        double min = ((Number) known.get(0)).doubleValue();
        double max = ((Number) known.get(known.size() - 1)).doubleValue();
        double current = ((Number) value).doubleValue();
        double normalized = lowerIsBetter ? (max - current) / (max - min) : (current - min) / (max - min);
        return Math.max(0.0, Math.min(weight, normalized * weight));
    }

    private boolean containsAny(String value, String... terms) {
        if (value == null) return false;
        String normalized = value.toLowerCase(Locale.ROOT);
        for (String term : terms) if (normalized.contains(term)) return true;
        return false;
    }

    private List<String> buildAdvantages(ChatbotCompareResponse.ComparisonVehicle vehicle,
                                         List<ChatbotCompareResponse.ComparisonVehicle> all, String rawPurpose) {
        List<String> advantages = new ArrayList<>();
        BigDecimal targetBudget = extractBudget(rawPurpose);
        BigDecimal highestPrice = all.stream().map(ChatbotCompareResponse.ComparisonVehicle::getPrice)
                .filter(value -> value != null).max(Comparator.naturalOrder()).orElse(null);
        Integer lowestMileage = all.stream().map(ChatbotCompareResponse.ComparisonVehicle::getMileage)
                .filter(value -> value != null).min(Comparator.naturalOrder()).orElse(null);
        Integer newestYear = all.stream().map(ChatbotCompareResponse.ComparisonVehicle::getManufactureYear)
                .filter(value -> value != null).max(Comparator.naturalOrder()).orElse(null);
        if (targetBudget == null && vehicle.getPrice() != null && vehicle.getPrice().equals(highestPrice)) {
            advantages.add("Vị trí sản phẩm cao trong nhóm so sánh.");
        } else if (targetBudget != null && vehicle.getPrice() != null
                && vehicle.getPrice().subtract(targetBudget).abs().doubleValue() / targetBudget.doubleValue() <= 0.15) {
            advantages.add("Mức giá nằm gần ngân sách đã nêu.");
        }
        if (vehicle.getMileage() != null && vehicle.getMileage().equals(lowestMileage)) advantages.add("Số km đã đi thấp nhất trong nhóm so sánh.");
        if (vehicle.getManufactureYear() != null && vehicle.getManufactureYear().equals(newestYear)) advantages.add("Đời xe mới nhất trong nhóm so sánh.");
        if (vehicle.getSeatCount() != null && all.stream().anyMatch(other -> other.getSeatCount() != null && vehicle.getSeatCount() > other.getSeatCount())) advantages.add("Có số chỗ cao hơn ít nhất một xe được chọn.");
        if (containsAny(rawPurpose, "sang", "cao cấp", "cao cap", "luxury")
                && containsAny(vehicle.getTitle(), "mercedes", "bmw", "audi", "lexus", "porsche")) {
            advantages.add("Phù hợp định hướng xe cao cấp theo nhu cầu đã nhập.");
        }
        if (vehicle.isDepositEligible()) advantages.add("Đang có trạng thái phù hợp để xem thông tin đặt cọc.");
        if (advantages.isEmpty()) advantages.add("Có thông số phù hợp để cân nhắc theo nhu cầu đã nhập.");
        return advantages;
    }
}
