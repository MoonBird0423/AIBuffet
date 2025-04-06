package com.aibuffet.service.impl;

import com.aibuffet.model.Model;
import com.aibuffet.repository.ModelRepository;
import com.aibuffet.service.ChatCompletionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatCompletionServiceImpl implements ChatCompletionService {

    private static final Logger logger = LoggerFactory.getLogger(ChatCompletionServiceImpl.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ModelRepository modelRepository;
    
    @Autowired
    private WebClient.Builder webClientBuilder;

    @Override
    public void streamChatCompletion(List<Map<String, Object>> messages, String modelName, SseEmitter emitter) {
        try {
            // 获取模型信息
            Model model = modelRepository.findByNameExact(modelName)
                .orElseThrow(() -> new RuntimeException("Model not found: " + modelName));

            // 构建请求体
            Map<String, Object> requestBody = buildRequestBody(messages, model);

            // 使用配置的WebClient.Builder创建实例
            WebClient client = webClientBuilder
                .baseUrl(model.getBaseUrl())
                .build();

            logger.info("Sending request to model [{}] at URL: {}", modelName, model.getBaseUrl());
            logger.debug("Request body: {}", objectMapper.writeValueAsString(requestBody));

            // 发送请求并处理流式响应
            client.post()
                .uri("/")
                .header("Authorization", "Bearer " + model.getApiKey())
                .header("X-Request-ID", java.util.UUID.randomUUID().toString())
                .header("Content-Type", "application/json; charset=UTF-8")
                .header("Accept", "text/event-stream")
                .bodyValue(requestBody)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class)
                .subscribe(
                    chunk -> {
                        try {
                            // 处理特殊标记
                            if ("[DONE]".equals(chunk.trim())) {
                                logger.debug("Received [DONE] signal");
                                return;
                            }

                            // 解析返回的数据块
                            Map<String, Object> data = objectMapper.readValue(chunk, Map.class);
                            emitter.send(data);
                            logger.trace("Sent chunk: {}", chunk);
                        } catch (Exception e) {
                            logger.error("Error processing chunk: {} - {}", chunk, e.getMessage());
                            // 不要因为单个chunk解析错误就中断整个流
                            logger.warn("Continuing despite chunk processing error");
                        }
                    },
                    error -> {
                        logger.error("与模型 [{}] 通信时发生错误: {}", modelName, error.getMessage());
                        logger.error("错误详情: ", error);
                        
                        // 区分不同类型的错误
                        String errorMessage;
                        if (error instanceof java.net.SocketException) {
                            errorMessage = "网络连接异常，请检查网络状态";
                            logger.error("网络连接异常: {}", error.getMessage());
                        } else if (error instanceof java.net.ConnectException) {
                            errorMessage = "无法连接到模型服务器";
                            logger.error("连接失败: {}", error.getMessage());
                        } else if (error instanceof java.net.SocketTimeoutException) {
                            errorMessage = "请求超时，请稍后重试";
                            logger.error("请求超时: {}", error.getMessage());
                        } else {
                            errorMessage = "调用模型服务失败: " + error.getMessage();
                        }
                        
                        handleError(emitter, errorMessage);
                    },
                    () -> {
                        try {
                            emitter.complete();
                            logger.info("Stream completed for model: {}", modelName);
                        } catch (Exception e) {
                            logger.error("Error completing emitter for model [{}]: {}", modelName, e.getMessage());
                        }
                    }
                );

        } catch (Exception e) {
            logger.error("Error in streamChatCompletion for model [{}]: {}", modelName, e.getMessage());
            handleError(emitter, "系统错误: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> buildRequestBody(List<Map<String, Object>> messages, String modelName) {
        try {
            // 获取模型信息
            Model model = modelRepository.findByNameExact(modelName)
                .orElseThrow(() -> new RuntimeException("Model not found: " + modelName));

            return buildRequestBody(messages, model);
        } catch (Exception e) {
            logger.error("Error building request body for model [{}]: {}", modelName, e.getMessage());
            throw new RuntimeException("构建请求参数失败: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> buildRequestBody(List<Map<String, Object>> messages, Model model) {
        try {
            // 解析模型配置
            String cleanConfig = model.getInvokeConfig()
                .replaceAll(",\\s*}", "}")
                .replaceAll(",\\s*]", "]");
            Map<String, Object> invokeConfig = objectMapper.readValue(cleanConfig, Map.class);

            // 确保消息内容使用UTF-8编码
            List<Map<String, Object>> encodedMessages = messages.stream()
                .map(message -> {
                    Map<String, Object> encodedMessage = new LinkedHashMap<>(message);
                    if (encodedMessage.containsKey("content")) {
                        Object content = encodedMessage.get("content");
                        if (content instanceof String) {
                            byte[] bytes = ((String) content).getBytes(StandardCharsets.UTF_8);
                            String utf8Content = new String(bytes, StandardCharsets.UTF_8);
                            encodedMessage.put("content", utf8Content);
                        }
                    }
                    return encodedMessage;
                })
                .toList();

            // 按指定顺序构建请求体
            Map<String, Object> requestBody = new LinkedHashMap<>();
            
            // 1. 保持model参数在第一位
            requestBody.put("model", invokeConfig.get("model"));
            
            // 2. messages参数在第二位
            requestBody.put("messages", encodedMessages);
            
            // 3. 其他基础参数
            if (invokeConfig.containsKey("stream")) {
                requestBody.put("stream", invokeConfig.get("stream"));
            }
            if (invokeConfig.containsKey("temperature")) {
                requestBody.put("temperature", invokeConfig.get("temperature"));
            }
            
            // 4. 其他可选参数
            invokeConfig.forEach((key, value) -> {
                if (!requestBody.containsKey(key)) {
                    requestBody.put(key, value);
                }
            });

            logger.info("Built request body for model [{}]: {}", model.getName(), requestBody);
            return requestBody;
        } catch (Exception e) {
            logger.error("Error building request body for model [{}]: {}", model.getName(), e.getMessage());
            throw new RuntimeException("构建请求参数失败: " + e.getMessage(), e);
        }
    }

    private void handleError(SseEmitter emitter, String errorMessage) {
        try {
            Map<String, Object> errorResponse = new LinkedHashMap<>();
            errorResponse.put("error", errorMessage);
            emitter.send(errorResponse);
            emitter.complete();
        } catch (Exception e) {
            logger.error("Error sending error response: {}", e.getMessage());
        }
    }
}