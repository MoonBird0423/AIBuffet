package com.aibuffet.service.impl;

import com.aibuffet.dto.MessageReference;
import com.aibuffet.dto.SearchRequest;
import com.aibuffet.dto.SearchResult;
import com.aibuffet.model.ChatSession;
import com.aibuffet.repository.ChatSessionRepository;
import com.aibuffet.service.ChatService;
import com.aibuffet.service.SearchService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

    @Autowired
    private SearchService searchService;

    private final ObjectMapper objectMapper = new ObjectMapper();

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

        // 初始化消息数组，包含提问对象信息
        String initialMessages = createInitialMessages(firstMessage, questionTargetType, questionTargetId, questionTargetName);
        chatSession.setMessages(initialMessages);
        chatSession.setIsDeleted(false);
        
        ChatSession saved = chatSessionRepository.save(chatSession);
        logger.info("Created chat session with ID: {} and question target: {}/{}", 
            saved.getSessionId(), questionTargetType, questionTargetName);
        return saved;
    }

    /**
     * 创建初始消息数组，包含提问对象信息
     */
    private String createInitialMessages(String firstMessage, String questionTargetType, String questionTargetId, String questionTargetName) {
        try {
            ArrayNode messages = objectMapper.createArrayNode();
            
            // 添加系统消息
            ObjectNode systemMessage = objectMapper.createObjectNode();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are a helpful assistant.");
            messages.add(systemMessage);
            
            // 添加用户消息
            ObjectNode userMessage = objectMapper.createObjectNode();
            userMessage.put("role", "user");
            userMessage.put("content", firstMessage);
            
            // 如果有提问对象，添加questionTarget信息
            if (questionTargetType != null && questionTargetId != null && questionTargetName != null) {
                ObjectNode questionTarget = objectMapper.createObjectNode();
                questionTarget.put("type", questionTargetType);
                questionTarget.put("id", questionTargetId);
                questionTarget.put("name", questionTargetName);
                userMessage.set("questionTarget", questionTarget);
            }
            
            messages.add(userMessage);
            
            return objectMapper.writeValueAsString(messages);
        } catch (JsonProcessingException e) {
            logger.error("Error creating initial messages JSON", e);
            // 降级到原有格式
            return String.format(
                "[{\"role\":\"system\",\"content\":\"You are a helpful assistant.\"}," +
                "{\"role\":\"user\",\"content\":\"%s\"}]",
                firstMessage.replace("\"", "\\\"")
            );
        }
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
        
        if (messages == null) {
            logger.warn("Received null messages for session {}, using empty array", sessionId);
            messages = "[]";
        }

        try {
            // 验证消息格式
            JsonNode messagesNode = objectMapper.readTree(messages);
            if (!messagesNode.isArray()) {
                logger.warn("Invalid messages format for session {}, using empty array", sessionId);
                messages = "[]";
            }
        } catch (Exception e) {
            logger.error("Error parsing messages JSON for session {}", sessionId, e);
            messages = "[]";
        }
        
        chatSession.setMessages(messages);
        ChatSession updated = chatSessionRepository.save(chatSession);
        logger.info("Updated chat session: {}", updated.getSessionId());
        return updated;
    }

    /**
     * 增强消息处理 - 对参考消息进行向量检索
     */
    public String enhanceMessageWithReferences(String messagesJson, Long userId) {
        try {
            JsonNode messagesNode = objectMapper.readTree(messagesJson);
            if (!messagesNode.isArray()) {
                return messagesJson;
            }
            
            ArrayNode messages = (ArrayNode) messagesNode;
            
            // 查找最后一条用户消息
            ObjectNode lastUserMessage = null;
            for (int i = messages.size() - 1; i >= 0; i--) {
                JsonNode message = messages.get(i);
                if ("user".equals(message.get("role").asText())) {
                    lastUserMessage = (ObjectNode) message;
                    break;
                }
            }
            
            if (lastUserMessage == null || !lastUserMessage.has("questionTarget")) {
                return messagesJson; // 没有找到带questionTarget的用户消息
            }
            
            JsonNode questionTarget = lastUserMessage.get("questionTarget");
            String userQuery = lastUserMessage.get("content").asText();
            
            // 执行向量检索
            List<SearchResult> searchResults = performVectorSearch(questionTarget, userQuery, userId);
            
            if (searchResults.isEmpty()) {
                // 如果没有检索到结果，添加提示
                String enhancedContent = userQuery + "\n\n[注：未找到相关参考内容]";
                lastUserMessage.put("content", enhancedContent);
            } else {
                // 构造增强消息
                String enhancedContent = constructEnhancedMessage(userQuery, searchResults);
                lastUserMessage.put("content", enhancedContent);
                
                // 保存检索结果供后续使用
                ArrayNode references = objectMapper.createArrayNode();
                for (SearchResult result : searchResults) {
                    ObjectNode ref = objectMapper.createObjectNode();
                    ref.put("fileId", result.getFileId());
                    ref.put("chunkIndex", result.getChunkIndex());
                    ref.put("fileName", result.getFileName());
                    ref.put("similarity", result.getSimilarity());
                    references.add(ref);
                }
                lastUserMessage.set("searchReferences", references);
            }
            
            return objectMapper.writeValueAsString(messages);
        } catch (Exception e) {
            logger.error("Error enhancing message with references", e);
            return messagesJson; // 降级返回原消息
        }
    }

    /**
     * 执行向量检索
     */
    private List<SearchResult> performVectorSearch(JsonNode questionTarget, String query, Long userId) {
        try {
            String type = questionTarget.get("type").asText();
            String id = questionTarget.get("id").asText();
            
            SearchRequest searchRequest = new SearchRequest();
            searchRequest.setQuery(query);
            searchRequest.setLimit(5); // 检索5个相关块
            searchRequest.setSimilarityThreshold(0.7f);
            
            if ("book".equals(type)) {
                searchRequest.setDocumentId(Long.valueOf(id));
                // 验证文档权限
                if (!searchService.validateDocumentPermission(Long.valueOf(id), userId)) {
                    logger.warn("User {} does not have permission to access document {}", userId, id);
                    return Collections.emptyList();
                }
            } else if ("knowledge".equals(type)) {
                searchRequest.setKnowledgeBaseId(Long.valueOf(id));
                // 验证知识库权限
                if (!searchService.validateKnowledgeBasePermission(Long.valueOf(id), userId)) {
                    logger.warn("User {} does not have permission to access knowledge base {}", userId, id);
                    return Collections.emptyList();
                }
            } else {
                logger.warn("Unknown question target type: {}", type);
                return Collections.emptyList();
            }
            
            return searchService.search(searchRequest);
        } catch (Exception e) {
            logger.error("Error performing vector search", e);
            return Collections.emptyList();
        }
    }

    /**
     * 构造增强消息
     */
    private String constructEnhancedMessage(String userQuery, List<SearchResult> searchResults) {
        StringBuilder enhanced = new StringBuilder();
        enhanced.append("用户问题：").append(userQuery).append("\n\n");
        enhanced.append("相关参考内容：\n");
        
        for (int i = 0; i < searchResults.size(); i++) {
            SearchResult result = searchResults.get(i);
            enhanced.append(i + 1).append(". 来源《").append(result.getFileName()).append("》\n");
            enhanced.append(result.getContent()).append("\n\n");
        }
        
        enhanced.append("请基于以上参考内容回答用户问题。如果参考内容不足以回答问题，请说明并提供一般性建议。");
        return enhanced.toString();
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
