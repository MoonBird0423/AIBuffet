# 模型调用流程设计（简化版）

## 核心思路
1. 直接使用JSON对象处理数据，减少DTO转换
2. 复用已有的JSON结构，减少数据转换
3. 统一消息格式，方便处理

## 数据流程图

```mermaid
sequenceDiagram
    participant Client
    participant ModelService
    participant ChatSession
    participant Model
    participant LLMProvider

    Client->>ModelService: 发送对话请求
    ModelService->>Model: 获取模型默认配置
    ModelService->>ChatSession: 获取对话历史
    ModelService->>ModelService: 合并请求
    ModelService->>LLMProvider: 调用模型
    LLMProvider-->>ModelService: 返回响应
    ModelService->>ChatSession: 更新对话历史
    ModelService-->>Client: 返回结果
```

## 简化的数据结构

1. 统一的消息格式
```json
{
    "role": "user",
    "content": [
        {
            "text": "消息内容",
            "type": "text"
        }
    ]
}
```

2. 模型配置（Model.invokeConfig）
```json
{
    "model": "qwen-plus",
    "system_message": {
        "role": "system",
        "content": [
            {
                "text": "You are a helpful assistant.",
                "type": "text"
            }
        ]
    },
    "stream": true,
    "temperature": 0.7,
    "max_tokens": 2000
}
```

3. 会话历史（ChatSession.messages，直接存储消息数组）
```json
[
    {
        "role": "user",
        "content": [
            {
                "text": "你好",
                "type": "text"
            }
        ]
    },
    {
        "role": "assistant",
        "content": [
            {
                "text": "你好！有什么我可以帮你的吗？",
                "type": "text"
            }
        ]
    }
]
```

## 简化的处理流程

```java
public class ModelService {
    
    public String chat(String modelId, String sessionId, String userInput) {
        // 1. 获取模型配置
        Model model = modelRepository.findById(modelId);
        JsonNode modelConfig = objectMapper.readTree(model.getInvokeConfig());
        
        // 2. 获取会话历史
        ChatSession session = chatSessionRepository.findById(sessionId);
        JsonNode historyMessages = objectMapper.readTree(session.getMessages());
        
        // 3. 构造请求体
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", modelConfig.get("model").asText());
        requestBody.put("stream", modelConfig.get("stream").asBoolean());
        requestBody.put("temperature", modelConfig.get("temperature").asDouble());
        requestBody.put("max_tokens", modelConfig.get("max_tokens").asInt());
        
        // 4. 组装消息
        ArrayNode messages = objectMapper.createArrayNode();
        // 4.1 添加系统消息
        messages.add(modelConfig.get("system_message"));
        // 4.2 添加历史消息
        messages.addAll((ArrayNode) historyMessages);
        // 4.3 添加新消息
        ObjectNode newMessage = objectMapper.createObjectNode();
        newMessage.put("role", "user");
        ArrayNode content = objectMapper.createArrayNode();
        ObjectNode textContent = objectMapper.createObjectNode();
        textContent.put("text", userInput);
        textContent.put("type", "text");
        content.add(textContent);
        newMessage.set("content", content);
        messages.add(newMessage);
        
        requestBody.set("messages", messages);
        
        // 5. 调用模型
        String response = callModelApi(requestBody.toString());
        
        // 6. 更新会话历史
        messages.add(objectMapper.readTree(response));
        session.setMessages(messages.toString());
        chatSessionRepository.save(session);
        
        return response;
    }
}
```

## 简化方案的优点

1. 直接操作JSON数据：
   - 不需要定义多个DTO类
   - 减少对象转换的开销
   - 更灵活地处理数据结构

2. 统一的消息格式：
   - 所有消息使用相同的结构
   - 易于验证和处理
   - 直接存储和读取

3. 更少的代码量：
   - 不需要维护多个DTO类
   - 减少了类型转换代码
   - 逻辑更直观

4. 更好的可维护性：
   - 数据结构简单明确
   - 处理逻辑集中
   - 易于调试和修改

## 注意事项

1. JSON处理：
   - 使用Jackson的JsonNode处理JSON
   - 处理可能的JSON解析异常
   - 注意JSON字段的类型转换

2. 数据验证：
   - 验证必要的字段存在
   - 检查数据格式的正确性
   - 处理异常情况

3. 性能考虑：
   - 合理使用JsonNode的API
   - 避免不必要的JSON解析
   - 考虑大量数据时的处理