package com.system.controller;

import com.system.dto.ChatMessageRequest;
import com.system.dto.ChatMessageResponse;
import com.system.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chatbot")
@Tag(name = "5. Chatbot API", description = "Trợ lý ảo AI tư vấn chọn xe thông minh theo mục đích sử dụng và tầm tài chính")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Tư vấn chọn xe qua Chatbot AI",
               description = "Khách hàng gửi câu hỏi về nhu cầu (gia đình, đi phố, phượt, xe điện, ngân sách). Hệ thống phân tích và gợi ý xe thật đang AVAILABLE trong kho kèm phản hồi từ Gemini AI.")
    public ResponseEntity<ChatMessageResponse> chat(@RequestBody ChatMessageRequest request) {
        ChatMessageResponse response = chatbotService.processChat(request);
        return ResponseEntity.ok(response);
    }
}
