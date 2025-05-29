package com.aibuffet.service.impl;

import com.aibuffet.model.ChatSession;
import com.aibuffet.repository.ChatSessionRepository;
import com.aibuffet.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Override
    public List<ChatSession> getUserChatSessions(Long userId) {
        logger.info("Getting chat sessions for user: {}", userId);
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByLastMessageAtDesc(userId);
        logger.info("Found {} chat sessions for user: {}", sessions.size(), userId);
        return sessions;
    }

    @Override
    public ChatSession getChatSession(Long userId, String sessionId) {
        logger.info("Getting chat session {} for user: {}", sessionId, userId);
        return chatSessionRepository.findByUserIdAndSessionId(userId, sessionId);
    }

    @Override
    @Transactional
    public ChatSession createChatSession(Long userId, String firstMessage) {
        return createChatSession(userId, firstMessage, null, null, null);
    }

    @Override
    @Transactional
    public ChatSession createChatSession(Long userId, String firstMessage, 
            String questionTargetType, String questionTargetId, String questionTargetName) {
        logger.info("Creating new chat session for user: {} with first message: {}", userId, firstMessage);
        
        ChatSession chatSession = new ChatSession();
        chatSession.setSessionId(UUID.randomUUID().toString());
        chatSession.setUserId(userId);
        chatSession.setFirstMessage(firstMessage);
        // 设置会话名称：如果有提问对象，使用提问对象名称；否则使用第一条消息内容
        String chatName;
        if (questionTargetName != null && !questionTargetName.trim().isEmpty()) {
            // 如果有提问对象，使用提问对象名称作为会话名称
            chatName = questionTargetName;
        } else {
            // 没有提问对象时，使用第一条消息内容（保持原有逻辑）
            chatName = firstMessage.length() > 50 ? firstMessage.substring(0, 47) + "..." : firstMessage;
        }
        chatSession.setChatName(chatName);

        // 设置提问对象信息
        chatSession.setQuestionTargetType(questionTargetType);
        chatSession.setQuestionTargetId(questionTargetId);
        chatSession.setQuestionTargetName(questionTargetName);

        // 初始化消息数组
        String initialMessages = String.format(
            "[{\"role\":\"system\",\"content\":\"You are a helpful assistant.\"}," +
            "{\"role\":\"user\",\"content\":\"%s\"}]",
            firstMessage.replace("\"", "\\\"")
        );
        chatSession.setMessages(initialMessages);
        chatSession.setIsDeleted(false);
        
        ChatSession saved = chatSessionRepository.save(chatSession);
        logger.info("Created chat session with ID: {} and question target: {}/{}", 
            saved.getSessionId(), questionTargetType, questionTargetName);
        return saved;
    }

    @Override
    @Transactional
    public ChatSession updateQuestionTarget(Long userId, String sessionId, 
            String questionTargetType, String questionTargetId, String questionTargetName) {
        logger.info("Updating question target for session {} user: {}", sessionId, userId);
        
        ChatSession chatSession = chatSessionRepository.findByUserIdAndSessionId(userId, sessionId);
        if (chatSession == null) {
            logger.error("Chat session {} not found for user {}", sessionId, userId);
            throw new RuntimeException("Chat session not found");
        }
        
        chatSession.setQuestionTargetType(questionTargetType);
        chatSession.setQuestionTargetId(questionTargetId);
        chatSession.setQuestionTargetName(questionTargetName);
        
        ChatSession updated = chatSessionRepository.save(chatSession);
        logger.info("Updated question target for session: {} to {}/{}", sessionId, questionTargetType, questionTargetName);
        return updated;
    }

    @Override
    @Transactional
    public ChatSession clearQuestionTarget(Long userId, String sessionId) {
        logger.info("Clearing question target for session {} user: {}", sessionId, userId);
        
        ChatSession chatSession = chatSessionRepository.findByUserIdAndSessionId(userId, sessionId);
        if (chatSession == null) {
            logger.error("Chat session {} not found for user {}", sessionId, userId);
            throw new RuntimeException("Chat session not found");
        }
        
        chatSession.setQuestionTargetType(null);
        chatSession.setQuestionTargetId(null);
        chatSession.setQuestionTargetName(null);
        
        ChatSession updated = chatSessionRepository.save(chatSession);
        logger.info("Cleared question target for session: {}", sessionId);
        return updated;
    }

    @Override
    @Transactional
    public ChatSession updateChatSession(Long userId, String sessionId, String messages) {
        logger.info("Updating chat session {} for user: {}", sessionId, userId);
        
        ChatSession chatSession = chatSessionRepository.findByUserIdAndSessionId(userId, sessionId);
        if (chatSession == null) {
            logger.error("Chat session {} not found for user {}", sessionId, userId);
            throw new RuntimeException("Chat session not found");
        }
        
        chatSession.setMessages(messages);
        ChatSession updated = chatSessionRepository.save(chatSession);
        logger.info("Updated chat session: {}", updated.getSessionId());
        return updated;
    }

    @Override
    @Transactional
    public void deleteChatSession(Long userId, String sessionId) {
        logger.info("Deleting chat session {} for user: {}", sessionId, userId);
        chatSessionRepository.softDeleteByUserIdAndSessionId(userId, sessionId);
        logger.info("Deleted chat session {} for user: {}", sessionId, userId);
    }

    @Override
    public List<Map<String, Object>> getRecentQuestionTargets(Long userId, int limit) {
        logger.info("Getting recent question targets for user: {} with limit: {}", userId, limit);
        
        // 获取用户最近的聊天会话，过滤出有提问对象的会话
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByLastMessageAtDesc(userId);
        
        // 使用 LinkedHashMap 保持插入顺序，同时避免重复
        Map<String, Map<String, Object>> uniqueTargets = new LinkedHashMap<>();
        
        for (ChatSession session : sessions) {
            // 检查是否有提问对象信息
            if (session.getQuestionTargetType() != null && 
                session.getQuestionTargetId() != null && 
                session.getQuestionTargetName() != null) {
                
                // 创建唯一标识符
                String uniqueKey = session.getQuestionTargetType() + ":" + session.getQuestionTargetId();
                
                // 如果还没有添加过这个提问对象，则添加
                if (!uniqueTargets.containsKey(uniqueKey)) {
                    Map<String, Object> target = new HashMap<>();
                    target.put("type", session.getQuestionTargetType());
                    target.put("id", session.getQuestionTargetId());
                    target.put("name", session.getQuestionTargetName());
                    
                    uniqueTargets.put(uniqueKey, target);
                    
                    // 如果已经达到限制数量，停止添加
                    if (uniqueTargets.size() >= limit) {
                        break;
                    }
                }
            }
        }
        
        List<Map<String, Object>> result = new ArrayList<>(uniqueTargets.values());
        logger.info("Found {} unique recent question targets for user: {}", result.size(), userId);
        return result;
    }
}
