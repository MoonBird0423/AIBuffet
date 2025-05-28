package com.aibuffet.controller;

import com.aibuffet.service.ChatCompletionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatCompletionController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatCompletionController.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ChatCompletionService chatCompletionService;
    
    @Value("${ai.chat.default.model}")
    private String defaultModel;

    @PostMapping(path = "/completions", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatCompletion(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        String userId = authentication.getName();
        logger.info("Received chat completion request from user: {}", userId);

        try {
            // 记录请求参数
            logger.info("Request parameters: {}", objectMapper.writeValueAsString(request));

            // 验证必要参数
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
            String modelName = (String) request.get("model");

            if (messages == null || messages.isEmpty()) {
                throw new IllegalArgumentException("Missing required parameter: messages");
            }

            // 如果未提供模型名称，使用默认模型
            if (!StringUtils.hasText(modelName)) {
                modelName = defaultModel;
                logger.info("No model specified, using default model: {}", modelName);
            }

            if (!StringUtils.hasText(modelName)) {
                throw new IllegalArgumentException("No model specified and no default model configured");
            }

            // 创建SSE发射器
            SseEmitter emitter = new SseEmitter(-1L); // 无超时

            // 设置完成回调
            emitter.onCompletion(() -> {
                logger.info("SSE connection completed for user: {}", userId);
            });

            // 设置超时回调
            emitter.onTimeout(() -> {
                logger.info("SSE connection timeout for user: {}", userId);
            });

            // 设置错误回调
            emitter.onError(ex -> {
                logger.error("SSE connection error for user: {}", userId, ex);
            });

            // 异步处理模型调用
            chatCompletionService.streamChatCompletion(messages, modelName, emitter);
            
            logger.info("Started streaming for user: {}", userId);
            return emitter;

        } catch (Exception e) {
            logger.error("Error processing chat completion request", e);
            throw new RuntimeException("处理请求失败: " + e.getMessage());
        }
    }
}
