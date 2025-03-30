package com.aibuffet.service.impl;

import com.aibuffet.model.ChatSession;
import com.aibuffet.repository.ChatSessionRepository;
import com.aibuffet.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Override
    public List<ChatSession> getUserChatSessions(String userId) {
        logger.info("Getting chat sessions for user: {}", userId);
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByLastMessageAtDesc(userId);
        logger.info("Found {} chat sessions for user: {}", sessions.size(), userId);
        return sessions;
    }

    @Override
    public ChatSession getChatSession(String userId, String sessionId) {
        logger.info("Getting chat session {} for user: {}", sessionId, userId);
        return chatSessionRepository.findByUserIdAndSessionId(userId, sessionId);
    }

    @Override
    @Transactional
    public ChatSession createChatSession(String userId, String firstMessage) {
        logger.info("Creating new chat session for user: {} with first message: {}", userId, firstMessage);
        
        ChatSession chatSession = new ChatSession();
        chatSession.setSessionId(UUID.randomUUID().toString());
        chatSession.setUserId(userId);
        chatSession.setFirstMessage(firstMessage);
        chatSession.setChatName(firstMessage.length() > 50 ? firstMessage.substring(0, 47) + "..." : firstMessage);

        // 初始化消息数组
        String initialMessages = String.format(
            "[{\"role\":\"system\",\"content\":[{\"type\":\"text\",\"text\":\"You are a helpful assistant.\"}]}," +
            "{\"role\":\"user\",\"content\":[{\"type\":\"text\",\"text\":\"%s\"}]}]",
            firstMessage.replace("\"", "\\\"")
        );
        chatSession.setMessages(initialMessages);
        chatSession.setIsDeleted(false);
        
        ChatSession saved = chatSessionRepository.save(chatSession);
        logger.info("Created chat session with ID: {}", saved.getSessionId());
        return saved;
    }

    @Override
    @Transactional
    public ChatSession updateChatSession(String userId, String sessionId, String messages) {
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
    public void deleteChatSession(String userId, String sessionId) {
        logger.info("Deleting chat session {} for user: {}", sessionId, userId);
        chatSessionRepository.softDeleteByUserIdAndSessionId(userId, sessionId);
        logger.info("Deleted chat session {} for user: {}", sessionId, userId);
    }
}