package com.aibuffet.controller;

import com.aibuffet.service.ChatCompletionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.List;
import java.util.Map;

@Component
public class ChatCompletionWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private ChatCompletionService chatCompletionService;

    @Value("${ai.chat.default.model}")
    private String defaultModel;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            Map<String, Object> req = objectMapper.readValue(message.getPayload(), Map.class);
            List<Map<String, Object>> messages = (List<Map<String, Object>>) req.get("messages");
            String modelName = req.get("model") != null && !((String)req.get("model")).isBlank() ? (String) req.get("model") : defaultModel;
            chatCompletionService.streamChatCompletionWebSocket(messages, modelName, session);
        } catch (Exception e) {
            try {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("error", "参数解析失败: " + e.getMessage()))));
            } catch (Exception ignore) {}
        }
    }
} 