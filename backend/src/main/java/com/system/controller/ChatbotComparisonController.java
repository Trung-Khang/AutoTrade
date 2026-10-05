package com.system.controller;

import com.system.dto.ChatbotCompareRequest;
import com.system.dto.ChatbotCompareResponse;
import com.system.service.ChatbotComparisonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chatbot")
public class ChatbotComparisonController {
    private final ChatbotComparisonService comparisonService;

    public ChatbotComparisonController(ChatbotComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    @PostMapping("/compare")
    public ResponseEntity<ChatbotCompareResponse> compare(@RequestBody ChatbotCompareRequest request) {
        return ResponseEntity.ok(comparisonService.compare(request));
    }
}
