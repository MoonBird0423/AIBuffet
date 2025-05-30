package com.aibuffet.service;

import com.aibuffet.dto.MessageReference;
import com.aibuffet.model.ChatSession;
import java.util.List;
import java.util.Map;

/**
 * 对话管理服务接口
 */
public interface ChatService {
    /**
     * 获取用户的所有对话列表
     * @param userId 用户ID
     * @return 对话列表
     */
    List<ChatSession> getUserChatSessions(Long userId);

    /**
     * 获取特定对话
     * @param userId 用户ID
     * @param sessionId 对话ID
     * @return 对话信息
     */
    ChatSession getChatSession(Long userId, String sessionId);

    /**
     * 创建新对话
     * @param userId 用户ID
     * @param firstMessage 第一条消息内容
     * @return 创建的对话信息
     */
    ChatSession createChatSession(Long userId, String firstMessage);

    /**
     * 创建新对话（带提问对象信息）
     * @param userId 用户ID
     * @param firstMessage 第一条消息内容
     * @param questionTargetType 提问对象类型
     * @param questionTargetId 提问对象ID
     * @param questionTargetName 提问对象名称
     * @return 创建的对话信息
     */
    ChatSession createChatSession(Long userId, String firstMessage, 
        String questionTargetType, String questionTargetId, String questionTargetName);

    /**
     * 更新对话的提问对象
     * @param userId 用户ID
     * @param sessionId 对话ID
     * @param questionTargetType 提问对象类型
     * @param questionTargetId 提问对象ID
     * @param questionTargetName 提问对象名称
     * @return 更新后的对话信息
     */
    ChatSession updateQuestionTarget(Long userId, String sessionId, 
        String questionTargetType, String questionTargetId, String questionTargetName);

    /**
     * 清除对话的提问对象
     * @param userId 用户ID
     * @param sessionId 对话ID
     * @return 更新后的对话信息
     */
    ChatSession clearQuestionTarget(Long userId, String sessionId);

    /**
     * 更新对话内容
     * @param userId 用户ID
     * @param sessionId 对话ID
     * @param messages 更新后的消息内容
     * @return 更新后的对话信息
     */
    ChatSession updateChatSession(Long userId, String sessionId, String messages);

    /**
     * 删除对话
     * @param userId 用户ID
     * @param sessionId 对话ID
     */
    void deleteChatSession(Long userId, String sessionId);

    /**
     * 获取用户最近使用的提问对象
     * @param userId 用户ID
     * @param limit 返回数量限制
     * @return 最近使用的提问对象列表
     */
    List<Map<String, Object>> getRecentQuestionTargets(Long userId, int limit);

    /**
     * 对消息进行向量检索增强处理
     * @param messagesJson 消息JSON字符串
     * @param userId 用户ID
     * @return 增强后的消息JSON字符串
     */
    String enhanceMessageWithReferences(String messagesJson, Long userId);
}
