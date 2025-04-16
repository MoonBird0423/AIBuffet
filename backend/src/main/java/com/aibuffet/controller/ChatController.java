package com.aibuffet.controller;

import com.aibuffet.model.ChatSession;
import com.aibuffet.model.User;
import com.aibuffet.service.ChatService;
import com.aibuffet.service.OSSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @Autowired
    private OSSService ossService;

    private Long getUserId(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalStateException("No authentication found");
        }
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<List<ChatSession>> getChatSessions(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<ChatSession> sessions = chatService.getUserChatSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ChatSession> getChatSession(
            Authentication authentication,
            @PathVariable String sessionId) {
        Long userId = getUserId(authentication);
        ChatSession chatSession = chatService.getChatSession(userId, sessionId);
        if (chatSession == null) {
            logger.warn("Chat session {} not found for user {}", sessionId, userId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(chatSession);
    }

    @PostMapping
    public ResponseEntity<ChatSession> createChatSession(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        Long userId = getUserId(authentication);
        String firstMessage = request.get("message");
        if (firstMessage == null || firstMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
            ChatSession session = chatService.createChatSession(userId, firstMessage);
        return ResponseEntity.ok(session);
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<ChatSession> updateChatSession(
            Authentication authentication,
            @PathVariable String sessionId,
            @RequestBody Map<String, String> request) {
        Long userId = getUserId(authentication);
        String messages = request.get("messages");
        if (messages == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            ChatSession updated = chatService.updateChatSession(userId, sessionId, messages);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            logger.error("Error updating chat session: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteChatSession(
            Authentication authentication,
            @PathVariable String sessionId) {
        Long userId = getUserId(authentication);
        chatService.deleteChatSession(userId, sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadChatImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        try {
            Long userId = getUserId(authentication);
            logger.info("开始处理图片上传请求: 用户ID={}, 文件名={}, 文件大小={}, 文件类型={}", 
                userId, file.getOriginalFilename(), file.getSize(), file.getContentType());

            String imageUrl = ossService.uploadChatImage(file, userId);
            
            logger.info("图片上传成功: 用户ID={}, URL={}", userId, imageUrl);
            Map<String, String> response = new HashMap<>();
            response.put("url", imageUrl);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("图片上传失败: 错误信息={}, 异常类型={}, 堆栈信息={}", 
                e.getMessage(), e.getClass().getName(), e.getStackTrace());
            return ResponseEntity.badRequest().build();
        }
    }
}
