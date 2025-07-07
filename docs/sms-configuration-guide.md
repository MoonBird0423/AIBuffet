# 短信服务配置指南

## 概述

本系统已将短信服务的配置参数从代码中提取到配置文件中，支持通过环境变量或配置文件进行灵活配置。

## 配置参数说明

### 环境变量配置

在 `application.properties` 中，短信服务支持以下环境变量配置：

```properties
# 短信服务配置
sms.sign-name=${SMS_SIGN_NAME:阿里云短信测试}
sms.verification-template-code=${SMS_VERIFICATION_TEMPLATE_CODE:SMS_154950909}
sms.endpoint=${SMS_ENDPOINT:dysmsapi.aliyuncs.com}
sms.code-expiration-minutes=${SMS_CODE_EXPIRATION_MINUTES:5}
sms.rate-limit-per-minute=${SMS_RATE_LIMIT_PER_MINUTE:3}
```

### 参数详细说明

| 参数名 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| 短信签名 | SMS_SIGN_NAME | 阿里云短信测试 | 在阿里云短信服务中申请的签名 |
| 验证码模板代码 | SMS_VERIFICATION_TEMPLATE_CODE | SMS_154950909 | 验证码短信的模板代码 |
| 短信服务端点 | SMS_ENDPOINT | dysmsapi.aliyuncs.com | 阿里云短信服务的API端点 |
| 验证码有效期 | SMS_CODE_EXPIRATION_MINUTES | 5 | 验证码的有效期（分钟） |
| 发送频率限制 | SMS_RATE_LIMIT_PER_MINUTE | 3 | 每分钟最多发送的短信数量 |

## 部署配置

### 开发环境

在开发环境中，可以直接使用默认值，或通过环境变量覆盖：

```bash
export SMS_SIGN_NAME="您的短信签名"
export SMS_VERIFICATION_TEMPLATE_CODE="您的模板代码"
export SMS_CODE_EXPIRATION_MINUTES=10
```

### 生产环境

在生产环境中，建议通过环境变量设置所有参数：

```bash
# 设置短信服务配置
export SMS_SIGN_NAME="书意科技"
export SMS_VERIFICATION_TEMPLATE_CODE="SMS_123456789"
export SMS_ENDPOINT="dysmsapi.aliyuncs.com"
export SMS_CODE_EXPIRATION_MINUTES=5
export SMS_RATE_LIMIT_PER_MINUTE=3
```

### Docker 部署

在 Docker 环境中，可以通过环境变量传递配置：

```yaml
version: '3.8'
services:
  aibuffet-backend:
    image: aibuffet-backend:latest
    environment:
      - SMS_SIGN_NAME=书意科技
      - SMS_VERIFICATION_TEMPLATE_CODE=SMS_123456789
      - SMS_CODE_EXPIRATION_MINUTES=5
      - SMS_RATE_LIMIT_PER_MINUTE=3
      - ALIBABA_CLOUD_ACCESS_KEY_ID=${ALIBABA_CLOUD_ACCESS_KEY_ID}
      - ALIBABA_CLOUD_ACCESS_KEY_SECRET=${ALIBABA_CLOUD_ACCESS_KEY_SECRET}
```

## 代码变更说明

### 新增文件

1. **SmsConfig.java** - 短信配置类
   - 位置：`backend/src/main/java/com/aibuffet/config/SmsConfig.java`
   - 功能：管理所有短信相关的配置参数

### 修改文件

1. **VerificationCodeService.java** - 短信验证码服务
   - 移除了硬编码的配置参数
   - 使用 `SmsConfig` 获取配置值
   - 支持动态设置验证码过期时间

2. **application.properties** - 应用配置文件
   - 新增短信服务配置段
   - 支持环境变量覆盖

## 优势

1. **配置灵活性**：支持通过环境变量动态配置，无需修改代码
2. **环境隔离**：不同环境可以使用不同的短信签名和模板
3. **安全性**：敏感配置通过环境变量管理，避免硬编码
4. **可维护性**：配置集中管理，便于维护和更新

## 注意事项

1. 确保在阿里云短信服务中已正确配置签名和模板
2. 验证码有效期建议设置在 3-10 分钟之间
3. 发送频率限制应根据业务需求合理设置
4. 生产环境中应使用正式的短信签名和模板代码 

## 重要变更：短信签名写死在代码中

由于在 Windows 环境下通过配置文件注入中文签名时极易出现乱码，导致阿里云短信接口报“找不到对应签名”，现已将短信签名直接写死在 `VerificationCodeService.java` 代码中，避免一切编码和环境变量干扰。

**相关代码片段：**
```java
// 直接写死短信签名，避免乱码问题
private final String signName = "征鸿于野软件开发工作室";
```

**注意事项：**
- 如需更换短信签名，请直接修改 `VerificationCodeService.java` 中的 `signName` 字段。
- 其他短信参数（如模板ID、endpoint等）仍可通过配置文件注入。
- 此变更是为彻底规避中文签名乱码问题，适用于本地开发和生产环境。

## 其他配置项
- `sms.verification-template-code`：短信模板ID
- `sms.endpoint`：阿里云短信服务端点
- `sms.code-expiration-minutes`：验证码有效期
- `sms.rate-limit-per-minute`：每分钟最大发送次数

如需恢复为配置文件注入签名，请确保 JVM 启动参数包含 `-Dfile.encoding=UTF-8` 并彻底排查环境变量和文件编码。 