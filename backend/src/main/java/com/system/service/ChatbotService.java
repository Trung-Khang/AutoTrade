package com.system.service;

import com.system.dto.ChatMessageRequest;
import com.system.dto.ChatMessageResponse;
import com.system.dto.RecommendedVehicleDto;
import com.system.entity.Listing;
import com.system.entity.Showroom;
import com.system.entity.Vehicle;
import com.system.repository.ListingRepository;
import com.system.repository.ShowroomRepository;
import com.system.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    private final VehicleRepository vehicleRepository;
    private final ListingRepository listingRepository;
    private final ShowroomRepository showroomRepository;
    private final RestTemplate restTemplate;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    public ChatbotService(VehicleRepository vehicleRepository,
                          ListingRepository listingRepository,
                          ShowroomRepository showroomRepository) {
        this.vehicleRepository = vehicleRepository;
        this.listingRepository = listingRepository;
        this.showroomRepository = showroomRepository;
        this.restTemplate = new RestTemplate();
    }

    public ChatMessageResponse processChat(ChatMessageRequest request) {
        String userMsg = request != null && request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMsg.isEmpty()) {
            return new ChatMessageResponse(
                    "Xin chào! Tôi là Trợ lý AI AutoTrade. Bạn có thể cho tôi biết nhu cầu mua xe (ví dụ: xe gia đình, xe nhỏ đi phố, xe đi phượt, xe điện hoặc tầm ngân sách) để tôi tư vấn xe phù hợp nhất nhé!",
                    Collections.emptyList()
            );
        }

        // 1. Phân tích ý định & tiêu chí tìm kiếm từ câu hỏi
        ParsedIntent intent = parseUserIntent(userMsg);

        // 2. Lấy toàn bộ xe AVAILABLE có Showroom hợp lệ từ Database
        List<Vehicle> availableVehicles = vehicleRepository.findAvailableVehiclesWithShowroom();

        // 3. Lọc và xếp hạng xe phù hợp nhất
        List<RecommendedVehicleDto> matchedCandidates = matchAndRankVehicles(availableVehicles, intent);

        // Giới hạn gợi ý top 3 - 4 xe tốt nhất
        List<RecommendedVehicleDto> topRecommendations = matchedCandidates.stream().limit(4).toList();

        // 4. Sinh lời thoại tư vấn (gọi Gemini AI hoặc dùng Fallback Template thông minh)
        String replyText = generateReplyText(userMsg, intent, topRecommendations);

        return new ChatMessageResponse(replyText, topRecommendations);
    }

    private ParsedIntent parseUserIntent(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        ParsedIntent intent = new ParsedIntent();

        // 1. Mục đích: Xe gia đình (7 chỗ hoặc MPV/SUV rộng)
        if (lower.contains("gia đình") || lower.contains("gia dinh") || lower.contains("7 chỗ") || lower.contains("7 cho")
                || lower.contains("đông người") || lower.contains("chở khách") || lower.contains("chở con") || lower.contains("mpv")) {
            intent.purpose = Purpose.FAMILY;
        }
        // 2. Mục đích: Xe đi phố (Sedan, Hatchback nhỏ gọn, số tự động)
        else if (lower.contains("đi phố") || lower.contains("di pho") || lower.contains("trong phố") || lower.contains("đô thị")
                || lower.contains("nhỏ gọn") || lower.contains("nho gon") || lower.contains("đi làm") || lower.contains("phụ nữ")
                || lower.contains("sedan") || lower.contains("hatchback") || lower.contains("dễ lái")) {
            intent.purpose = Purpose.CITY;
        }
        // 3. Mục đích: Xe đi phượt / leo đèo / đường xấu (SUV, Crossover, Bán tải)
        else if (lower.contains("phượt") || lower.contains("phuot") || lower.contains("đi xa") || lower.contains("đường đèo")
                || lower.contains("leo dốc") || lower.contains("địa hình") || lower.contains("gầm cao") || lower.contains("gam cao")
                || lower.contains("suv") || lower.contains("crossover") || lower.contains("bán tải") || lower.contains("pickup")) {
            intent.purpose = Purpose.ADVENTURE;
        }
        // 4. Mục đích: Xe điện (VinFast / Electric)
        else if (lower.contains("xe điện") || lower.contains("xe dien") || lower.contains("vinfast") || lower.contains("vf")
                || lower.contains("sạc điện") || lower.contains("tiết kiệm xăng") || lower.contains("bảo vệ môi trường")) {
            intent.purpose = Purpose.ELECTRIC;
        }
        // 5. Mục đích: Xe chạy dịch vụ / kinh tế
        else if (lower.contains("dịch vụ") || lower.contains("dich vu") || lower.contains("grab") || lower.contains("taxi")
                || lower.contains("kinh doanh")) {
            intent.purpose = Purpose.COMMERCIAL;
        }
        // 6. Mục đích: Xe sang / Doanh nhân
        else if (lower.contains("sang") || lower.contains("doanh nhân") || lower.contains("gặp đối tác")
                || lower.contains("mercedes") || lower.contains("bmw") || lower.contains("audi") || lower.contains("lexus") || lower.contains("porsche")) {
            intent.purpose = Purpose.LUXURY;
        }

        // Tách ngân sách (ví dụ: 500 triệu, 500tr, 1 tỷ, 800tr...)
        Pattern billionPattern = Pattern.compile("(\\d+([.,]\\d+)?)\\s*(tỷ|ty)", Pattern.CASE_INSENSITIVE);
        Matcher bMatcher = billionPattern.matcher(lower);
        if (bMatcher.find()) {
            double val = Double.parseDouble(bMatcher.group(1).replace(",", "."));
            intent.maxBudget = BigDecimal.valueOf(val * 1_000_000_000L);
        } else {
            Pattern millionPattern = Pattern.compile("(\\d+)\\s*(triệu|trieu|tr|m)", Pattern.CASE_INSENSITIVE);
            Matcher mMatcher = millionPattern.matcher(lower);
            if (mMatcher.find()) {
                long val = Long.parseLong(mMatcher.group(1));
                intent.maxBudget = BigDecimal.valueOf(val * 1_000_000L);
            }
        }

        // Tách khu vực showroom
        if (lower.contains("hcm") || lower.contains("hồ chí minh") || lower.contains("sài gòn")) {
            intent.city = "TP. Hồ Chí Minh";
        } else if (lower.contains("hà nội") || lower.contains("ha noi")) {
            intent.city = "Hà Nội";
        } else if (lower.contains("đà nẵng") || lower.contains("da nang")) {
            intent.city = "Đà Nẵng";
        }

        // Tách thương hiệu (nếu có nhắc rõ)
        List<String> commonBrands = List.of("VinFast", "Toyota", "Mazda", "Hyundai", "Kia", "Honda", "Ford", "Mercedes-Benz", "BMW", "Porsche");
        for (String b : commonBrands) {
            if (lower.contains(b.toLowerCase(Locale.ROOT))) {
                intent.brand = b;
                break;
            }
        }

        return intent;
    }

    private List<RecommendedVehicleDto> matchAndRankVehicles(List<Vehicle> vehicles, ParsedIntent intent) {
        List<ScoredVehicle> scored = new ArrayList<>();

        for (Vehicle v : vehicles) {
            BigDecimal price = resolvePrice(v);
            String title = (v.getBrand() + " " + v.getModel() + " " + (v.getVariant() != null ? v.getVariant() : "")).trim();
            Showroom showroom = v.getShowroomId() != null ? showroomRepository.findById(v.getShowroomId()).orElse(null) : null;
            String img = resolveImageUrl(v);

            int score = 10; // Điểm cơ bản cho xe AVAILABLE

            // 1. Khớp mục đích sử dụng
            if (intent.purpose != null) {
                switch (intent.purpose) {
                    case FAMILY:
                        if (v.getSeatCount() != null && v.getSeatCount() >= 7) score += 35;
                        else if (v.getBodyType() != null && (v.getBodyType().equalsIgnoreCase("MPV") || v.getBodyType().equalsIgnoreCase("SUV"))) score += 25;
                        break;
                    case CITY:
                        if (v.getBodyType() != null && (v.getBodyType().equalsIgnoreCase("Sedan") || v.getBodyType().equalsIgnoreCase("Hatchback"))) score += 30;
                        if (v.getTransmission() != null && v.getTransmission().toLowerCase().contains("tự động")) score += 15;
                        break;
                    case ADVENTURE:
                        if (v.getBodyType() != null && (v.getBodyType().equalsIgnoreCase("SUV") || v.getBodyType().equalsIgnoreCase("Crossover") || v.getBodyType().equalsIgnoreCase("Pickup"))) score += 35;
                        break;
                    case ELECTRIC:
                        if (v.getFuelType() != null && v.getFuelType().equalsIgnoreCase("Điện")) score += 40;
                        else if ("VinFast".equalsIgnoreCase(v.getBrand())) score += 35;
                        break;
                    case COMMERCIAL:
                        if (price != null && price.compareTo(new BigDecimal("600000000")) <= 0) score += 25;
                        if (v.getBrand() != null && (v.getBrand().equalsIgnoreCase("Toyota") || v.getBrand().equalsIgnoreCase("Hyundai") || v.getBrand().equalsIgnoreCase("Mitsubishi"))) score += 20;
                        break;
                    case LUXURY:
                        if (v.getBrand() != null && (v.getBrand().equalsIgnoreCase("Mercedes-Benz") || v.getBrand().equalsIgnoreCase("BMW") || v.getBrand().equalsIgnoreCase("Porsche") || v.getBrand().equalsIgnoreCase("Lexus") || v.getBrand().equalsIgnoreCase("Audi"))) score += 35;
                        break;
                }
            }

            // 2. Khớp ngân sách
            if (intent.maxBudget != null && price != null) {
                BigDecimal budgetCeiling = intent.maxBudget.multiply(new BigDecimal("1.15")); // Chấp nhận chênh 15%
                if (price.compareTo(budgetCeiling) <= 0) {
                    score += 30;
                    // Nếu giá nằm rất gần ngân sách (dưới ngân sách tối đa)
                    if (price.compareTo(intent.maxBudget) <= 0) {
                        score += 10;
                    }
                } else {
                    score -= 40; // Vượt quá ngân sách bị trừ điểm nặng
                }
            }

            // 3. Khớp thành phố / Showroom
            if (intent.city != null && showroom != null) {
                if (showroom.getCity() != null && showroom.getCity().toLowerCase().contains(intent.city.toLowerCase())) {
                    score += 25;
                }
            }

            // 4. Khớp thương hiệu
            if (intent.brand != null && v.getBrand() != null) {
                if (v.getBrand().equalsIgnoreCase(intent.brand)) {
                    score += 30;
                }
            }

            RecommendedVehicleDto dto = new RecommendedVehicleDto(
                    v.getId(),
                    title,
                    price,
                    v.getBodyType() != null ? v.getBodyType() : "Sedan",
                    v.getSeatCount() != null ? v.getSeatCount() : 5,
                    v.getFuelType() != null ? v.getFuelType() : "Xăng",
                    v.getTransmission() != null ? v.getTransmission() : "Tự động",
                    img,
                    showroom != null ? showroom.getName() : "Showroom AutoTrade",
                    showroom != null ? showroom.getCity() : "Chi nhánh AutoTrade"
            );

            scored.add(new ScoredVehicle(dto, score));
        }

        scored.sort((a, b) -> Integer.compare(b.score, a.score));
        return scored.stream().map(s -> s.dto).collect(Collectors.toList());
    }

    private BigDecimal resolvePrice(Vehicle vehicle) {
        if (vehicle.getPrice() != null && vehicle.getPrice().compareTo(BigDecimal.ZERO) > 0) {
            return vehicle.getPrice();
        }
        List<Listing> listings = listingRepository.findByVehicleId(vehicle.getId());
        if (listings != null && !listings.isEmpty() && listings.get(0).getPrice() != null) {
            return listings.get(0).getPrice();
        }
        return BigDecimal.valueOf(500_000_000L); // Default fallback
    }

    private String resolveImageUrl(Vehicle vehicle) {
        List<Listing> listings = listingRepository.findByVehicleId(vehicle.getId());
        if (listings != null && !listings.isEmpty() && listings.get(0).getImageUrl() != null && !listings.get(0).getImageUrl().isBlank()) {
            return listings.get(0).getImageUrl();
        }
        return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
    }

    private String generateReplyText(String userMsg, ParsedIntent intent, List<RecommendedVehicleDto> vehicles) {
        // Cố gắng gọi Gemini API nếu có key
        if (geminiApiKey != null && !geminiApiKey.trim().isBlank()) {
            try {
                String aiResponse = callGeminiApi(userMsg, vehicles, intent);
                if (aiResponse != null && !aiResponse.isBlank()) {
                    return aiResponse;
                }
            } catch (Exception ex) {
                log.warn("Gemini API call failed, falling back to smart template advisor: {}", ex.getMessage());
            }
        }

        // Fallback: Smart Template Engine (chạy tức thì, 100% chuẩn văn phong tư vấn)
        return generateSmartTemplateReply(intent, vehicles);
    }

    private String callGeminiApi(String userQuery, List<RecommendedVehicleDto> vehicles, ParsedIntent intent) {
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey.trim();

        StringBuilder vehicleContext = new StringBuilder();
        if (vehicles.isEmpty()) {
            vehicleContext.append("Hiện không có mẫu xe nào hoàn toàn trùng khớp trong kho.");
        } else {
            DecimalFormat df = new DecimalFormat("#,###");
            for (int i = 0; i < vehicles.size(); i++) {
                RecommendedVehicleDto v = vehicles.get(i);
                vehicleContext.append(i + 1).append(". ")
                        .append(v.getTitle())
                        .append(" - Giá: ").append(v.getPrice() != null ? df.format(v.getPrice()) + " VNĐ" : "Liên hệ")
                        .append(" - ").append(v.getSeatCount()).append(" chỗ, ").append(v.getBodyType()).append(", số ").append(v.getTransmission())
                        .append(", nhiên liệu ").append(v.getFuelType())
                        .append(" tại ").append(v.getShowroomName()).append(" (").append(v.getShowroomCity()).append(")\n");
            }
        }

        String prompt = "Bạn là Trợ lý AI tư vấn xe thông minh của sàn xe AutoTrade (Used-Car Smart System).\n"
                + "Khách hàng hỏi: \"" + userQuery + "\"\n\n"
                + "Dưới đây là danh sách xe ĐANG CÓ SẴN (AVAILABLE) và đủ điều kiện đặt cọc trong kho của hệ thống:\n"
                + vehicleContext.toString() + "\n"
                + "YÊU CẦU TRẢ LỜI:\n"
                + "1. Trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích (khoảng 2-4 câu ngắn).\n"
                + "2. Phân tích nhanh tại sao các mẫu xe này phù hợp với nhu cầu khách (ví dụ: xe gia đình thì khen rộng rãi 7 chỗ, xe đi phố thì khen nhỏ gọn số tự động tiết kiệm xăng, xe phượt thì khen gầm cao, xe điện thì khen công nghệ xanh).\n"
                + "3. Chỉ tư vấn xe CÓ TRONG DANH SÁCH TRÊN, tuyệt đối không bịa xe ngoài.\n"
                + "4. Hướng dẫn khách hàng bấm vào các thẻ xe hiển thị bên dưới để xem chi tiết và tiến hành đặt cọc giữ xe trực tuyến.";

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map body = response.getBody();
            List candidates = (List) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map firstCand = (Map) candidates.get(0);
                Map contentObj = (Map) firstCand.get("content");
                if (contentObj != null) {
                    List parts = (List) contentObj.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map firstPart = (Map) parts.get(0);
                        return (String) firstPart.get("text");
                    }
                }
            }
        }

        return null;
    }

    private String generateSmartTemplateReply(ParsedIntent intent, List<RecommendedVehicleDto> vehicles) {
        if (vehicles.isEmpty()) {
            return "Dạ chào bạn! Hiện tại các mẫu xe theo đúng tiêu chí này đã được khách hàng đặt cọc giữ chỗ hết. Bạn có thể thử tìm kiếm với tầm giá linh hoạt hơn hoặc xem qua danh sách xe đang mở bán tại showroom nhé!";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Dạ chào bạn! ");

        if (intent.purpose != null) {
            switch (intent.purpose) {
                case FAMILY:
                    sb.append("Với nhu cầu **xe phục vụ gia đình**, không gian rộng rãi (từ 5 - 7 chỗ) và sự thoải mái cho các thành viên là ưu tiên hàng đầu. ");
                    break;
                case CITY:
                    sb.append("Với nhu cầu **di chuyển linh hoạt trong phố**, những dòng xe nhỏ gọn, số tự động và tiết kiệm nhiên liệu sẽ là lựa chọn tối ưu nhất cho bạn. ");
                    break;
                case ADVENTURE:
                    sb.append("Để chuẩn bị cho những **chuyến đi phượt, cung đường đèo dốc hay địa hình gồ ghề**, những dòng xe gầm cao máy khỏe (SUV/Crossover) dưới đây sẽ đáp ứng hoàn hảo cho bạn. ");
                    break;
                case ELECTRIC:
                    sb.append("Đối với xu hướng **xe điện thông minh**, tiết kiệm chi phí sạc và vận hành êm ái, AutoTrade xin gợi ý các dòng xe điện VinFast đang mở bán. ");
                    break;
                case COMMERCIAL:
                    sb.append("Với nhu cầu **chạy dịch vụ/kinh doanh**, các dòng xe bền bỉ, tiết kiệm xăng và chi phí bảo dưỡng rẻ dưới đây sẽ giúp bạn thu hồi vốn nhanh nhất. ");
                    break;
                case LUXURY:
                    sb.append("Với tiêu chí **xe sang trọng, lịch lãm để đi làm hoặc gặp gỡ đối tác**, các dòng xe cao cấp dưới đây sẽ mang lại sự đẳng cấp và tiện nghi vượt trội. ");
                    break;
            }
        } else if (intent.maxBudget != null) {
            sb.append("Với tầm tài chính bạn mong muốn, ");
        } else {
            sb.append("Dựa trên yêu cầu của bạn, ");
        }

        sb.append("AutoTrade hiện đang có sẵn **").append(vehicles.size()).append(" mẫu xe độc bản** hoàn toàn phù hợp trong kho:\n\n");

        for (int i = 0; i < vehicles.size(); i++) {
            RecommendedVehicleDto v = vehicles.get(i);
            DecimalFormat df = new DecimalFormat("#,###");
            String priceStr = v.getPrice() != null ? df.format(v.getPrice()) + " đ" : "Liên hệ";
            sb.append(i + 1).append(". **").append(v.getTitle()).append("** - Giá: ").append(priceStr)
                    .append(" (").append(v.getSeatCount()).append(" chỗ, ").append(v.getShowroomCity()).append(")\n");
        }

        sb.append("\n👉 Bạn có thể bấm trực tiếp vào các thẻ xe bên dưới để xem hình ảnh thực tế và đặt cọc online giữ xe ngay nhé!");
        return sb.toString();
    }

    private static class ScoredVehicle {
        RecommendedVehicleDto dto;
        int score;

        ScoredVehicle(RecommendedVehicleDto dto, int score) {
            this.dto = dto;
            this.score = score;
        }
    }

    private static class ParsedIntent {
        Purpose purpose;
        BigDecimal maxBudget;
        String city;
        String brand;
    }

    private enum Purpose {
        FAMILY,
        CITY,
        ADVENTURE,
        ELECTRIC,
        COMMERCIAL,
        LUXURY
    }
}
