# 模型查询API修改计划

## 数据库修改
需要在models表中添加新的字段，用于存储模型支持的输入类型和调用配置：

```sql
ALTER TABLE models
ADD COLUMN supported_input_types JSON,
ADD COLUMN invoke_config TEXT;
```

### 字段说明

1. supported_input_types：使用JSON数组格式存储模型支持的输入类型，例如：
```json
["text", "image", "document", "video", "audio"]
```
默认值设置为空数组[]，需要在创建模型时明确指定支持的输入类型。

2. invoke_config：使用TEXT类型存储JSON格式的调用配置。
配置结构示例：
```json
{
    "model": "qwen-plus",
    "defaultSystemMessage": {
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
    "maxTokens": 2000
}
```

### 消息格式说明
在实际调用时，需要将invoke_config中的配置与用户的对话消息合并。对话消息格式如下：
```json
{
    "messages": [
        {
            "role": "system",
            "content": [
                {
                    "text": "You are a helpful assistant.",
                    "type": "text"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "text": "你好",
                    "type": "text"
                }
            ]
        }
    ]
}
```

## 实体类修改
在Model.java中添加对应的字段：

1. supportedInputTypes：使用Set<String>类型，并使用@Column注解配置JSON类型
2. invokeConfig：使用String类型，并使用@Column(columnDefinition = "TEXT")注解

## 调用处理
1. 当需要调用模型时，从Model实体中获取invoke_config
2. 解析invoke_config为对象
3. 将用户的对话消息与模型的defaultSystemMessage合并
4. 使用合并后的完整配置调用模型

## 注意事项
1. 数据库修改需要考虑已有数据的兼容性
2. supported_input_types默认值为空数组，需要在创建模型时指定支持的输入类型
3. invoke_config允许为空，不设置默认值
4. 在合并消息时需要保持消息的顺序，确保system消息在最前面