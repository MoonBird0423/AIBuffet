package com.aibuffet.controller;

import com.aibuffet.service.ChatCompletionService;
import com.aibuffet.service.ChatService;
import com.aibuffet.model.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(ChatCompletionWebSocketHandler.class);

    @Autowired
    private ChatCompletionService chatCompletionService;

    @Autowired
    private ChatService chatService;

    @Value("${ai.chat.default.model}")
    private String defaultModel;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            // 强制输出错误级别日志，确保能看到
            logger.error("[WebSocket Handler] ===== WebSocket消息处理器被调用 =====");
            logger.info("[WebSocket Handler] 收到WebSocket消息: {}", message.getPayload());
            
            Map<String, Object> req = objectMapper.readValue(message.getPayload(), Map.class);
            List<Map<String, Object>> messages = (List<Map<String, Object>>) req.get("messages");
            String modelName = req.get("model") != null && !((String)req.get("model")).isBlank() ? (String) req.get("model") : defaultModel;
            
            logger.info("[WebSocket Handler] 解析WebSocket请求 - 消息数量: {}, 模型: {}", messages.size(), modelName);
            
            // 检查消息中是否包含questionTarget
            boolean hasQuestionTarget = false;
            for (Map<String, Object> msg : messages) {
                if ("user".equals(msg.get("role")) && msg.containsKey("questionTarget")) {
                    hasQuestionTarget = true;
                    logger.info("[WebSocket Handler] 在用户消息中发现questionTarget: {}", msg.get("questionTarget"));
                    break;
                }
            }
            
            // 获取用户ID（从session属性中获取）
            Long userId = getUserIdFromSession(session);
            if (userId == null) {
                logger.error("[WebSocket Handler] 无法从WebSocket会话获取用户ID");
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("error", "用户未认证"))));
                return;
            }
            
            logger.info("[WebSocket Handler] 收到WebSocket聊天完成请求，用户: {}, 包含questionTarget: {}", userId, hasQuestionTarget);
            
            // 对消息进行增强处理
            String messagesJson = objectMapper.writeValueAsString(messages);
            logger.info("[WebSocket Handler] 原始消息JSON长度: {}", messagesJson.length());
            
            String enhancedJson = chatService.enhanceMessageWithReferences(messagesJson, userId);
            logger.info("[WebSocket Handler] 增强后消息JSON长度: {}", enhancedJson.length());
            
            messages = objectMapper.readValue(enhancedJson, List.class);
            logger.info("[WebSocket Handler] 消息增强完成，最终消息数量: {}", messages.size());
            
            // 强制输出错误级别日志，确保能看到处理完成
            logger.error("[WebSocket Handler] ===== 开始调用ChatCompletionService =====");
            
            chatCompletionService.streamChatCompletionWebSocket(messages, modelName, session);
        } catch (Exception e) {
            logger.error("[WebSocket Handler] 处理WebSocket聊天完成请求时发生错误", e);
            try {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("error", "参数解析失败: " + e.getMessage()))));
            } catch (Exception ignore) {
                logger.error("[WebSocket Handler] 发送错误消息到WebSocket会话时发生错误", ignore);
            }
        }
    }
    
    /**
     * 从WebSocket会话中获取用户ID
     * 注意：这个方法需要根据你的WebSocket认证机制来实现
     */
    private Long getUserIdFromSession(WebSocketSession session) {
        try {
            // 从session属性中获取用户信息
            Object userObj = session.getAttributes().get("user");
            if (userObj instanceof User) {
                return ((User) userObj).getId();
            }
            
            // 如果session属性中没有用户信息，尝试从其他方式获取
            // 这里可能需要根据你的具体实现来调整
            logger.warn("No user found in WebSocket session attributes");
            return null;
        } catch (Exception e) {
            logger.error("Error getting user ID from WebSocket session", e);
            return null;
        }
    }
} 