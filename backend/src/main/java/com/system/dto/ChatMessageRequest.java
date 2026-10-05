package com.system.dto;

import java.util.ArrayList;
import java.util.List;

public class ChatMessageRequest {
    private String message;
    private String sessionId;
    private String previousQuery;
    private List<Long> excludedListingIds = new ArrayList<>();

    public ChatMessageRequest() {}

    public ChatMessageRequest(String message, String sessionId) {
        this.message = message;
        this.sessionId = sessionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getPreviousQuery() { return previousQuery; }
    public void setPreviousQuery(String previousQuery) { this.previousQuery = previousQuery; }
    public List<Long> getExcludedListingIds() { return excludedListingIds; }
    public void setExcludedListingIds(List<Long> excludedListingIds) {
        this.excludedListingIds = excludedListingIds != null ? excludedListingIds : new ArrayList<>();
    }
}
