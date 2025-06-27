# JWT密钥管理指南

## 概述

本文档介绍如何生成和管理JWT密钥，确保应用的安全性和token的有效性。

## 密钥生成方法

### 1. 使用OpenSSL生成密钥（推荐）

#### Linux/macOS
```bash
# 生成96字节的Base64编码密钥
openssl rand -base64 96

# 生成128字节的Base64编码密钥（更安全）
openssl rand -base64 128
```

#### Windows (Git Bash)
```bash
# 生成96字节的Base64编码密钥
openssl rand -base64 96

# 生成128字节的Base64编码密钥（更安全）
openssl rand -base64 128
```

#### Windows (PowerShell)
```powershell
# 生成随机字节数组
$bytes = New-Object Byte[] 96
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 2. 使用在线工具生成密钥

**注意**: 生产环境不建议使用在线工具，仅用于开发测试。

- [JWT.io](https://jwt.io/) - 可以生成测试密钥
- [Random.org](https://www.random.org/passwords/) - 生成随机密码

### 3. 使用编程语言生成密钥

#### Java
```java
import java.security.SecureRandom;
import java.util.Base64;

public class JwtKeyGenerator {
    public static void main(String[] args) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[96];
        random.nextBytes(bytes);
        String secret = Base64.getEncoder().encodeToString(bytes);
        System.out.println("JWT Secret: " + secret);
    }
}
```

#### Python
```python
import secrets
import base64

# 生成96字节的随机密钥
random_bytes = secrets.token_bytes(96)
secret = base64.b64encode(random_bytes).decode('utf-8')
print(f"JWT Secret: {secret}")
```

#### Node.js
```javascript
const crypto = require('crypto');

// 生成96字节的随机密钥
const randomBytes = crypto.randomBytes(96);
const secret = randomBytes.toString('base64');
console.log('JWT Secret:', secret);
```

## 密钥安全要求

### 最小安全标准
- **长度**: 至少64字节（512位）
- **随机性**: 使用加密安全的随机数生成器
- **复杂度**: 包含字母、数字和特殊字符
- **算法**: 兼容HS512算法

### 推荐安全标准
- **长度**: 96-128字节（768-1024位）
- **生成器**: OpenSSL或系统加密API
- **存储**: 环境变量或安全的配置管理
- **轮换**: 定期更换密钥

## 配置方法

### 1. 开发环境配置

在 `application.properties` 中设置默认密钥：

```properties
# JWT配置
jwt.expiration=${AIBUFFET_JWT_EXPIRATION:86400000}
jwt.secret=${AIBUFFET_JWT_SECRET:your-generated-secret-key-here}
```

### 2. 生产环境配置

#### 使用环境变量
```bash
# Linux/macOS
export AIBUFFET_JWT_SECRET="your-production-secret-key"

# Windows
set AIBUFFET_JWT_SECRET=your-production-secret-key
```

#### 使用Docker环境变量
```dockerfile
ENV AIBUFFET_JWT_SECRET=your-production-secret-key
```

#### 使用Kubernetes Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jwt-secret
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aibuffet-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: AIBUFFET_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: jwt-secret
```

## 密钥轮换策略

### 1. 零停机轮换

```java
// 支持多个密钥的JWT工具类
@Component
public class JwtUtil {
    private SecretKey currentKey;
    private SecretKey previousKey;
    
    @PostConstruct
    public void init() {
        this.currentKey = Keys.hmacShaKeyFor(currentSecret.getBytes());
        this.previousKey = Keys.hmacShaKeyFor(previousSecret.getBytes());
    }
    
    public boolean validateToken(String token) {
        try {
            // 首先尝试当前密钥
            return validateWithKey(token, currentKey);
        } catch (Exception e) {
            try {
                // 如果失败，尝试旧密钥
                return validateWithKey(token, previousKey);
            } catch (Exception ex) {
                return false;
            }
        }
    }
}
```

### 2. 轮换步骤

1. **准备阶段**
   - 生成新密钥
   - 更新配置（支持新旧密钥）

2. **部署阶段**
   - 部署支持多密钥的应用
   - 验证新旧token都能正常工作

3. **迁移阶段**
   - 逐步让用户重新登录
   - 监控旧token的使用情况

4. **清理阶段**
   - 移除旧密钥支持
   - 清理配置

## 密钥验证工具

### 1. 在线验证
- [JWT.io](https://jwt.io/) - 可以验证token和密钥

### 2. 命令行验证
```bash
# 使用jq验证JWT payload（不验证签名）
echo "your-jwt-token" | cut -d. -f2 | base64 -d | jq .
```

### 3. 编程验证
```java
// Java验证示例
public boolean validateJwtToken(String token, String secret) {
    try {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return !claims.getExpiration().before(new Date());
    } catch (Exception e) {
        return false;
    }
}
```

## 安全最佳实践

### 1. 密钥管理
- ✅ 使用足够长的随机密钥
- ✅ 通过环境变量配置
- ✅ 不同环境使用不同密钥
- ✅ 定期轮换密钥
- ❌ 不要在代码中硬编码密钥
- ❌ 不要使用可预测的密钥
- ❌ 不要将密钥提交到版本控制

### 2. 应用配置
- ✅ 使用HTTPS传输
- ✅ 设置合理的token过期时间
- ✅ 实现token刷新机制
- ✅ 记录安全事件日志
- ❌ 不要在前端存储敏感信息
- ❌ 不要使用过短的过期时间

### 3. 监控和审计
- ✅ 监控token验证失败
- ✅ 记录异常登录行为
- ✅ 定期审查密钥使用情况
- ✅ 实施安全事件响应计划

## 故障排除

### 常见问题

#### 1. Token验证失败
**症状**: WebSocket连接返回401错误
**原因**: 密钥不匹配或token过期
**解决**: 检查密钥配置，验证token有效性

#### 2. 应用重启后token失效
**症状**: 用户需要重新登录
**原因**: 使用了动态生成的密钥
**解决**: 使用固定的密钥配置

#### 3. 密钥长度不足
**症状**: JWT签名验证失败
**原因**: 密钥长度不满足算法要求
**解决**: 生成更长的密钥（至少64字节）

### 调试命令

```bash
# 检查密钥长度
echo -n "your-secret" | wc -c

# 验证Base64编码
echo "your-secret" | base64 -d | wc -c

# 测试密钥复杂度
echo "your-secret" | grep -E ".*[A-Z].*[a-z].*[0-9].*[^A-Za-z0-9].*"
```

## 相关文件

- `backend/src/main/java/com/aibuffet/security/JwtUtil.java` - JWT工具类
- `backend/src/main/resources/application.properties` - 应用配置
- `docs/WEBSOCKET_FIX_SUMMARY.md` - WebSocket修复总结

## 更新日志

- **2025-06-27**: 初始版本，包含密钥生成方法和安全建议
- **2025-06-27**: 添加密钥轮换策略和故障排除指南 