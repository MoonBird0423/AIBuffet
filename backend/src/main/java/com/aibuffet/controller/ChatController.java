package com.aibuffet.controller;

import com.aibuffet.dto.CreateChatRequest;
import com.aibuffet.dto.QuestionTargetRequest;
import com.aibuffet.dto.ReferenceChunkDetail;
import com.aibuffet.model.ChatSession;
import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import com.aibuffet.model.User;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.service.ChatService;
import com.aibuffet.service.OSSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @Autowired
    private OSSService ossService;

    @Autowired
    private DocChunkRepository docChunkRepository;

    @Autowired
    private DocFileRepository docFileRepository;

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

        // 确保 messages 字段不为 null
        if (chatSession.getMessages() == null) {
            logger.warn("Chat session {} has null messages, initializing with empty array", sessionId);
            chatSession.setMessages("[]");
            chatSession = chatService.updateChatSession(userId, sessionId, "[]");
        }

        // 验证消息格式
        try {
            new ObjectMapper().readTree(chatSession.getMessages());
        } catch (Exception e) {
            logger.error("Invalid messages format in session {}, resetting to empty array", sessionId, e);
            chatSession = chatService.updateChatSession(userId, sessionId, "[]");
        }

        return ResponseEntity.ok(chatSession);
    }

    @PostMapping
    public ResponseEntity<ChatSession> createChatSession(
            Authentication authentication,
            @RequestBody CreateChatRequest request) {
        Long userId = getUserId(authentication);
        String firstMessage = request.getMessage();
        if (firstMessage == null || firstMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        ChatSession session = chatService.createChatSession(
            userId, 
            firstMessage,
            request.getQuestionTargetType(),
            request.getQuestionTargetId(),
            request.getQuestionTargetName()
        );
        return ResponseEntity.ok(session);
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<ChatSession> updateChatSession(
            Authentication authentication,
            @PathVariable String sessionId,
            @RequestBody Map<String, String> request) {
        Long userId = getUserId(authentication);
        String messages = request.get("messages");
        
        try {
            // 1. 先检查会话是否存在
            ChatSession existingSession = chatService.getChatSession(userId, sessionId);
            if (existingSession == null) {
                logger.error("Chat session not found: sessionId={}, userId={}", sessionId, userId);
                return ResponseEntity.status(404)
                    .body(null);
            }
            
            // 2. 验证消息格式
            if (messages == null) {
                logger.error("Invalid messages format: messages is null");
                return ResponseEntity.badRequest()
                    .body(null);
            }

            // 3. 尝试更新会话
            ChatSession updated = chatService.updateChatSession(userId, sessionId, messages);
            logger.info("Successfully updated chat session: sessionId={}, userId={}", sessionId, userId);
            return ResponseEntity.ok(updated);
            
        } catch (RuntimeException e) {
            logger.error("Error updating chat session: sessionId={}, userId={}, error={}", 
                sessionId, userId, e.getMessage());
            return ResponseEntity.status(500)
                .body(null);
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteChatSession(
            Authentication authentication,
            @PathVariable String sessionId) {
        Long userId = getUserId(authentication);
        try {
            chatService.deleteChatSession(userId, sessionId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Error deleting chat session: sessionId={}, userId={}, error={}", 
                sessionId, userId, e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{sessionId}/question-target")
    public ResponseEntity<ChatSession> updateQuestionTarget(
            Authentication authentication,
            @PathVariable String sessionId,
            @RequestBody QuestionTargetRequest request) {
        Long userId = getUserId(authentication);
        try {
            ChatSession updated = chatService.updateQuestionTarget(
                userId, 
                sessionId, 
                request.getQuestionTargetType(),
                request.getQuestionTargetId(),
                request.getQuestionTargetName()
            );
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            logger.error("Error updating question target: sessionId={}, userId={}, error={}", 
                sessionId, userId, e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{sessionId}/question-target")
    public ResponseEntity<ChatSession> clearQuestionTarget(
            Authentication authentication,
            @PathVariable String sessionId) {
        Long userId = getUserId(authentication);
        try {
            ChatSession updated = chatService.clearQuestionTarget(userId, sessionId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            logger.error("Error clearing question target: sessionId={}, userId={}, error={}", 
                sessionId, userId, e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/recent-targets")
    public ResponseEntity<List<Map<String, Object>>> getRecentQuestionTargets(
            Authentication authentication,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            Long userId = getUserId(authentication);
            List<Map<String, Object>> recentTargets = chatService.getRecentQuestionTargets(userId, limit);
            return ResponseEntity.ok(recentTargets);
        } catch (Exception e) {
            logger.error("Get recent question targets failed: userId={}, error={}", 
                getUserId(authentication), e.getMessage());
            return ResponseEntity.status(500).build();
        }
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
            logger.error("图片上传失败: 用户ID={}, 错误信息={}", 
                getUserId(authentication), e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/reference-chunks")
    public ResponseEntity<List<ReferenceChunkDetail>> getReferenceChunks(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        try {
            Long userId = getUserId(authentication);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> references = (List<Map<String, Object>>) request.get("references");
            
            if (references == null || references.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            List<ReferenceChunkDetail> details = new ArrayList<>();
            
            for (Map<String, Object> ref : references) {
                Long fileId = Long.valueOf(ref.get("fileId").toString());
                Integer chunkIndex = Integer.valueOf(ref.get("chunkIndex").toString());
                Float similarity = Float.valueOf(ref.get("similarity").toString());
                
                // 查询文档块详情
                Optional<DocChunk> chunkOpt = docChunkRepository.findByFileIdAndChunkIndex(fileId, chunkIndex);
                if (chunkOpt.isPresent()) {
                    DocChunk chunk = chunkOpt.get();
                    
                    // 查询文件信息
                    Optional<DocFile> fileOpt = docFileRepository.findById(fileId);
                    if (fileOpt.isPresent()) {
                        DocFile file = fileOpt.get();
                        
                        // 验证用户权限
                        if (file.getUploadedBy().equals(userId) || "PUBLISHED".equals(file.getPublishStatus())) {
                            ReferenceChunkDetail detail = new ReferenceChunkDetail(
                                fileId,
                                chunkIndex,
                                file.getFileName(),
                                chunk.getContent(),
                                similarity
                            );
                            details.add(detail);
                        } else {
                            logger.warn("User {} does not have permission to access file {}", userId, fileId);
                        }
                    }
                } else {
                    logger.warn("Chunk not found: fileId={}, chunkIndex={}", fileId, chunkIndex);
                }
            }
            
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            logger.error("Error getting reference chunks: userId={}, error={}", 
                getUserId(authentication), e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
