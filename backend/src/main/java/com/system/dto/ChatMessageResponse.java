package com.system.dto;

import java.util.ArrayList;
import java.util.List;

public class ChatMessageResponse {
    private String reply;
    private List<RecommendedVehicleDto> recommendedVehicles;

    public ChatMessageResponse() {
        this.recommendedVehicles = new ArrayList<>();
    }

    public ChatMessageResponse(String reply, List<RecommendedVehicleDto> recommendedVehicles) {
        this.reply = reply;
        this.recommendedVehicles = recommendedVehicles != null ? recommendedVehicles : new ArrayList<>();
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<RecommendedVehicleDto> getRecommendedVehicles() {
        return recommendedVehicles;
    }

    public void setRecommendedVehicles(List<RecommendedVehicleDto> recommendedVehicles) {
        this.recommendedVehicles = recommendedVehicles;
    }
}
