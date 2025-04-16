package com.aibuffet.service;

import com.aibuffet.model.ChatSession;
import java.util.List;

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
}
