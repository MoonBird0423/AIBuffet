# 微信支付集成指南

## 概述

本项目已集成微信支付官方SDK，支持Native支付（扫码支付）功能。

## 配置步骤

### 1. 获取微信支付证书

1. 登录微信支付商户平台：https://pay.weixin.qq.com/
2. 进入"账户中心" -> "API安全" -> "API证书"
3. 下载商户API证书和私钥文件
4. 将私钥文件重命名为 `apiclient_key.pem` 并放置在 `backend/src/main/resources/cert/` 目录下

### 2. 配置参数

在 `application.properties` 或环境变量中配置以下参数：

```properties
# 微信支付配置
wechatpay.appid=你的微信支付AppID
wechatpay.mchid=你的商户号
wechatpay.merchant_id=你的商户号
wechatpay.private_key_path=classpath:cert/apiclient_key.pem
wechatpay.merchant_serial_number=你的商户证书序列号
wechatpay.notify_url=https://你的域名/api/order/notify
wechatpay.apiv3_key=你的APIv3密钥
wechatpay.order_expire_minutes=120
```

### 3. 参数说明

- `appid`: 微信支付AppID
- `mchid`: 商户号
- `merchant_id`: 商户号（与mchid相同）
- `private_key_path`: 商户API私钥文件路径
- `merchant_serial_number`: 商户证书序列号
- `notify_url`: 支付成功回调通知地址
- `apiV3_key`: APIv3密钥
- `order_expire_minutes`: 订单过期时间（分钟）

## 功能说明

### 1. 创建订单

- 接口：`POST /api/order/create`
- 功能：创建微信支付订单，返回二维码URL
- 参数：用户ID、会员类型、订阅周期、支付方式、金额、描述

### 2. 查询订单状态

- 接口：`GET /api/order/status/{outTradeNo}`
- 功能：查询订单支付状态，支持轮询
- 返回：订单状态（未支付/已支付/支付超时/已关闭）

### 3. 微信支付回调

- 接口：`POST /api/order/notify`
- 功能：接收微信支付回调通知
- 处理：验签、解密、更新订单状态

### 4. 查询用户订单

- 接口：`GET /api/order/list?userId={userId}`
- 功能：查询用户所有订单记录

## 前端集成

前端支付弹窗已集成微信支付功能：

1. 用户选择会员类型和周期
2. 点击"立即支付"创建订单
3. 显示支付二维码
4. 轮询订单状态
5. 支付成功后关闭弹窗

## 安全注意事项

1. **证书安全**：证书文件包含敏感信息，不要提交到版本控制系统
2. **配置安全**：生产环境使用环境变量或配置中心管理敏感配置
3. **回调安全**：确保回调地址为HTTPS且公网可访问
4. **验签安全**：SDK自动处理签名验证，确保回调数据完整性

## 错误处理

### 常见错误码

- `ORDER_NOT_EXISTS`: 订单不存在
- `INVALID_REQUEST`: 请求参数错误
- `SIGN_ERROR`: 签名验证失败

### 异常处理

SDK会抛出以下异常：

- `ServiceException`: 微信支付API返回错误
- `ValidationException`: 签名验证失败
- `HttpException`: HTTP请求异常

## 测试

### 1. 本地测试

1. 配置开发环境参数
2. 启动应用
3. 使用微信支付沙箱环境测试

### 2. 生产测试

1. 配置生产环境参数
2. 确保回调地址公网可访问
3. 使用真实微信支付环境测试

## 监控和日志

建议监控以下指标：

1. 订单创建成功率
2. 支付成功率
3. 回调处理成功率
4. 订单状态查询响应时间

## 故障排查

### 1. 订单创建失败

- 检查证书配置
- 检查商户号配置
- 检查APIv3密钥配置

### 2. 回调处理失败

- 检查回调地址配置
- 检查证书序列号
- 检查验签逻辑

### 3. 订单状态查询失败

- 检查商户号配置
- 检查网络连接
- 检查API权限

## 更新日志

- v1.0.0: 初始版本，支持Native支付
- 使用微信支付官方SDK v0.2.17
- 支持自动证书更新
- 支持回调验签和解密 