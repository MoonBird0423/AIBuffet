package com.aibuffet.controller;

import com.aibuffet.model.ChatSession;
import com.aibuffet.model.User;
import com.aibuffet.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    private String getUserId(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalStateException("No authentication found");
        }
        User user = (User) authentication.getPrincipal();
        return user.getId().toString();
    }

    @GetMapping
    public ResponseEntity<List<ChatSession>> getChatSessions(Authentication authentication) {
        String userId = getUserId(authentication);
        logger.info("Fetching chat sessions for user: {}", userId);
        List<ChatSession> sessions = chatService.getUserChatSessions(userId);
        logger.info("Found {} chat sessions", sessions.size());
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ChatSession> getChatSession(
            Authentication authentication,
            @PathVariable String sessionId) {
        String userId = getUserId(authentication);
        logger.info("Fetching chat session {} for user: {}", sessionId, userId);
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
        String userId = getUserId(authentication);
        String firstMessage = request.get("message");
        if (firstMessage == null || firstMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        logger.info("Creating new chat session for user: {}", userId);
        ChatSession session = chatService.createChatSession(userId, firstMessage);
        logger.info("Created chat session: {}", session.getSessionId());
        return ResponseEntity.ok(session);
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<ChatSession> updateChatSession(
            Authentication authentication,
            @PathVariable String sessionId,
            @RequestBody Map<String, String> request) {
        String userId = getUserId(authentication);
        String messages = request.get("messages");
        if (messages == null) {
            return ResponseEntity.badRequest().build();
        }
        logger.info("Updating chat session {} for user: {}", sessionId, userId);
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
        String userId = getUserId(authentication);
        logger.info("Deleting chat session {} for user: {}", sessionId, userId);
        chatService.deleteChatSession(userId, sessionId);
        return ResponseEntity.ok().build();
    }
}