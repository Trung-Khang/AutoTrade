package com.system.dto;

import java.util.List;

public class ChatbotCompareRequest {
    private List<Long> listingIds;
    private String purpose;

    public ChatbotCompareRequest() {
    }

    public List<Long> getListingIds() { return listingIds; }
    public void setListingIds(List<Long> listingIds) { this.listingIds = listingIds; }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}
