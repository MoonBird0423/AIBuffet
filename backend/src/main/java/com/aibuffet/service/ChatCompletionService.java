package com.aibuffet.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import java.util.Map;
import org.springframework.web.socket.WebSocketSession;

/**
 * 对话补全服务接口
 */
public interface ChatCompletionService {
    
    /**
     * 流式调用模型进行对话
     * @param messages 对话历史消息
     * @param modelName 模型名称
     * @param emitter SSE发射器
     */
    void streamChatCompletion(List<Map<String, Object>> messages, String modelName, SseEmitter emitter);

    /**
     * 构建请求体
     * @param messages 对话历史消息
     * @param modelName 模型名称
     * @return 完整的请求体
     */
    Map<String, Object> buildRequestBody(List<Map<String, Object>> messages, String modelName);

    /**
     * Spring WebSocket流式推送方法
     * @param messages 对话历史消息
     * @param modelName 模型名称
     * @param wsSession WebSocket会话
     */
    void streamChatCompletionWebSocket(List<Map<String, Object>> messages, String modelName, WebSocketSession wsSession);
}