# 后端日志配置指南

## 日志配置说明

### 1. 已开启的日志级别

在 `application.properties` 中，我们为以下组件开启了 INFO 级别的日志：

```properties
# 聊天相关日志
logging.level.com.aibuffet.controller.ChatController=INFO
logging.level.com.aibuffet.controller.ChatCompletionController=INFO
logging.level.com.aibuffet.service.ChatCompletionService=INFO
logging.level.com.aibuffet.service.impl.ChatCompletionServiceImpl=INFO

# WebClient和网络相关日志
logging.level.com.aibuffet.config.WebClientConfig=INFO
logging.level.org.springframework.web.reactive.function.client.WebClient=INFO
logging.level.reactor.netty=INFO
logging.level.io.netty=INFO
```

### 2. 调试日志标识

所有流式输出相关的调试日志都使用 `[SSE Debug]` 前缀，便于过滤和查找。

### 3. 关键日志点

#### 连接建立阶段
- `[SSE Debug] 开始流式聊天完成` - 方法开始
- `[SSE Debug] 获取到模型信息` - 模型信息获取
- `[SSE Debug] 构建请求体完成` - 请求体构建
- `[SSE Debug] 准备连接模型服务` - DNS解析开始
- `[SSE Debug] DNS解析完成` - 连接建立
- `[SSE Debug] 开始建立连接` - 请求发送

#### 流式处理阶段
- `[SSE Debug] 处理响应chunk` - 每个数据块的处理
- `[SSE Debug] 准备发送内容到SSE` - 内容发送前
- `[SSE Debug] 成功发送数据到SSE` - 发送成功
- `[SSE Debug] 累积内容` - 内容累积
- `[SSE Debug] 处理进度` - 每100字符的进度报告

#### 完成和错误处理
- `[SSE Debug] 收到[DONE]信号` - 流式结束
- `[SSE Debug] Stream completed` - 流式完成
- `[SSE Debug] 与模型通信时发生错误` - 错误处理

## 查看日志的方法

### 1. 控制台日志
在服务器控制台中直接查看实时日志输出。

### 2. 日志文件
如果配置了日志文件，查看应用日志文件。

### 3. 测试日志配置
访问测试端点验证日志配置：
```
GET /api/chat/test-log
```

## 日志分析要点

### 1. 时序分析
观察以下时间间隔：
- 连接建立时间
- 第一个chunk接收时间
- 后续chunk的间隔时间
- 总处理时间

### 2. 数据量分析
关注以下指标：
- 每个chunk的大小
- 累积内容长度
- 处理速度（字符/秒）

### 3. 错误分析
注意以下错误类型：
- DNS解析错误
- 网络连接错误
- 超时错误
- 数据解析错误

## 预期日志模式

### 正常流式输出
```
[SSE Debug] 开始流式聊天完成，模型: deepseek-chat, 消息数量: 3
[SSE Debug] 获取到模型信息: deepseek-chat, 基础URL: https://api.deepseek.com
[SSE Debug] 构建请求体完成，大小: 1234 bytes
[SSE Debug] 准备连接模型服务 [deepseek-chat], 开始DNS解析: https://api.deepseek.com
[SSE Debug] DNS解析完成，开始建立连接: https://api.deepseek.com/v1/chat/completions
[SSE Debug] 开始建立连接，时间戳: 1703123456789
[SSE Debug] 处理响应chunk，长度: 45, 内容: {"choices":[{"delta":{"content":"根据"}}]}
[SSE Debug] 准备发送内容到SSE，长度: 2, 内容: 根据
[SSE Debug] 成功发送数据到SSE
[SSE Debug] 累积内容，当前总长度: 2, 本次添加: 2
[SSE Debug] 处理响应chunk，长度: 47, 内容: {"choices":[{"delta":{"content":"提供的"}}]}
[SSE Debug] 准备发送内容到SSE，长度: 3, 内容: 提供的
[SSE Debug] 成功发送数据到SSE
[SSE Debug] 累积内容，当前总长度: 5, 本次添加: 3
...
[SSE Debug] 收到[DONE]信号，当前生成内容长度: 156
[SSE Debug] Stream completed for model: deepseek-chat, 总耗时: 2345ms, 生成内容长度: 156
```

### 分批输出问题
如果出现分批输出，可能看到：
- chunk间隔时间过长（>500ms）
- chunk大小异常（>1000字符）
- 处理速度不稳定

## 问题排查步骤

1. **检查连接建立**
   - 确认DNS解析时间
   - 验证连接建立是否成功

2. **分析数据接收**
   - 观察chunk接收间隔
   - 检查chunk大小分布

3. **监控发送状态**
   - 确认SSE发送是否及时
   - 检查是否有发送失败

4. **对比正常情况**
   - 与本地环境对比
   - 分析网络环境差异

## 日志过滤命令

### 使用grep过滤SSE调试日志
```bash
# 过滤所有SSE调试日志
grep "\[SSE Debug\]" application.log

# 过滤特定类型的日志
grep "\[SSE Debug\] 处理响应chunk" application.log
grep "\[SSE Debug\] 成功发送数据到SSE" application.log

# 过滤错误日志
grep "\[SSE Debug\].*ERROR" application.log
```

### 使用tail实时监控
```bash
# 实时监控SSE调试日志
tail -f application.log | grep "\[SSE Debug\]"
```

## 性能指标

### 正常指标
- 连接建立时间：<2秒
- 第一个chunk接收时间：<5秒
- chunk间隔时间：<100ms
- 处理速度：>50字符/秒

### 异常指标
- 连接建立时间：>10秒
- chunk间隔时间：>500ms
- 处理速度：<10字符/秒
- 频繁的连接错误 