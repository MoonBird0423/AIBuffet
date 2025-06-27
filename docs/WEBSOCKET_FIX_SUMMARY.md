# WebSocket连接问题修复总结

## 问题描述

前端尝试连接WebSocket时出现连接失败错误：
```
WebSocket connection to 'ws://lovesuyi.cn/ws/chat/completions' failed
```

## 问题分析

1. **认证时机问题**: 后端WebSocket认证拦截器期望在握手时获取token，但前端是在连接建立后才在消息中发送token
2. **nginx代理配置**: WebSocket代理配置可能需要优化
3. **URL编码问题**: token在URL参数中可能需要正确解码
4. **JWT密钥问题**: 后端每次重启都会生成新的JWT密钥，导致之前的token失效

## 已实施的修复

### 1. 前端修改 (`frontend/src/services/api.js`)

- 修改了`createChatWebSocket`函数
- 在WebSocket URL中添加token参数用于握手认证
- 移除了消息中的token字段

```javascript
// 修改前
const wsUrl = process.env.NODE_ENV === 'production'
  ? `wss://${window.location.host}/ws/chat/completions`
  : `ws://${window.location.host}/ws/chat/completions`;

// 修改后
const baseUrl = process.env.NODE_ENV === 'production'
  ? `wss://${window.location.host}/ws/chat/completions`
  : `ws://${window.location.host}/ws/chat/completions`;

const wsUrl = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
```

### 2. 后端修改 (`backend/src/main/java/com/aibuffet/controller/ChatCompletionWebSocketHandler.java`)

- 移除了消息中的token验证逻辑
- 因为token已经在握手时验证过了

### 3. 后端WebSocket认证拦截器优化 (`backend/src/main/java/com/aibuffet/config/WebSocketConfig.java`)

- 添加了URL解码逻辑来处理编码的token参数
- 改进了错误处理和日志记录
- 使用INFO级别日志替代ERROR级别，确保日志可见

### 4. nginx配置优化 (`nginx-1.24.0/conf/nginx.conf`)

- 优化了WebSocket代理配置
- 添加了连接超时设置
- 禁用了缓冲以确保实时传输

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8080/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    proxy_connect_timeout 60s;
    
    # 禁用缓冲，确保实时传输
    proxy_buffering off;
    proxy_cache off;
}
```

### 5. JWT密钥修复 (`backend/src/main/java/com/aibuffet/security/JwtUtil.java`)

**关键发现**: JWT工具类每次应用启动都会生成新的密钥，导致之前的token失效

- 修改为使用固定的密钥
- 添加了JWT密钥配置到application.properties
- 确保应用重启后token仍然有效

```java
// 修改前
this.key = Keys.secretKeyFor(SignatureAlgorithm.HS512);

// 修改后
this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
```

### 6. 配置文件更新 (`backend/src/main/resources/application.properties`)

```properties
# JWT配置
jwt.expiration=${AIBUFFET_JWT_EXPIRATION:86400000}
jwt.secret=${AIBUFFET_JWT_SECRET:aibuffet-secret-key-for-jwt-token-generation-and-validation}
```

### 7. Spring Security放行WebSocket路径

**问题现象**：WebSocket握手请求被Spring Security拦截，后端直接返回401，未进入WebSocket认证拦截器。

**修复方法**：
在`SecurityConfig.java`的`.authorizeHttpRequests()`配置中，新增如下放行规则：

```java
.requestMatchers("/ws/**").permitAll() // 放行WebSocket握手路径
```

**修改后关键片段：**
```java
.authorizeHttpRequests(authorize -> authorize
    .requestMatchers("/ws/**").permitAll() // 新增
    ...
    .anyRequest().authenticated())
```

**修复效果**：
- WebSocket握手请求不再被Spring Security拦截，能够进入WebSocketConfig和认证拦截器。
- 后端日志会出现`[WebSocket Auth]`相关输出，认证流程正常。

**注意事项**：
- 只放行`/ws/**`，其他接口权限不受影响。
- 修改后需重启后端服务。

## 问题诊断过程

1. **nginx访问日志分析**: 发现WebSocket请求确实到达后端，但返回401状态码
2. **后端日志分析**: 没有看到WebSocket认证日志，说明请求可能没有到达认证拦截器
3. **JWT token分析**: 发现token本身没有过期，问题在于后端密钥变化
4. **代码审查**: 发现JWT工具类每次启动生成新密钥的问题

## 测试工具

创建了以下测试工具来帮助诊断问题：

1. **HTML测试页面** (`test-websocket.html`): 浏览器中测试WebSocket连接
2. **Node.js测试脚本** (`debug-websocket.js`): 命令行测试WebSocket连接
3. **JWT Token解析工具** (`test-jwt.html`): 解析和验证JWT token

## 验证步骤

1. 确保后端服务在8080端口运行
2. 确保前端开发服务器在3000端口运行
3. 确保nginx在80端口运行并正确代理
4. 确保hosts文件包含 `127.0.0.1 lovesuyi.cn`
5. 测试WebSocket连接: `curl -I "http://lovesuyi.cn/ws/chat/completions"`
6. 重启后端服务以应用JWT密钥修复

## 可能的问题排查

如果问题仍然存在，请检查：

1. **后端日志**: 查看WebSocket认证拦截器的日志输出
2. **nginx日志**: 查看nginx的错误日志
3. **浏览器开发者工具**: 查看Network标签页中的WebSocket连接状态
4. **token有效性**: 确保JWT token没有过期
5. **网络连接**: 确保所有服务都正常运行
6. **JWT密钥**: 确保后端使用固定的JWT密钥

## 下一步

1. **重启后端服务**以应用代码修改（特别是JWT密钥修复）
2. **重新加载nginx配置**
3. **清除浏览器缓存**
4. **测试WebSocket连接**

## 相关文件

- `frontend/src/services/api.js` - 前端WebSocket连接逻辑
- `backend/src/main/java/com/aibuffet/config/WebSocketConfig.java` - WebSocket配置
- `backend/src/main/java/com/aibuffet/controller/ChatCompletionWebSocketHandler.java` - WebSocket处理器
- `backend/src/main/java/com/aibuffet/security/JwtUtil.java` - JWT工具类
- `backend/src/main/resources/application.properties` - 应用配置
- `nginx-1.24.0/conf/nginx.conf` - nginx配置
- `test-websocket.html` - WebSocket测试页面
- `debug-websocket.js` - WebSocket测试脚本
- `test-jwt.html` - JWT Token测试页面
- `docs/jwt-secret-management.md` - JWT密钥管理指南 