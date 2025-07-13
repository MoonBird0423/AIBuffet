# 微信支付证书目录

请将以下文件放置在此目录：

1. `apiclient_key.pem` - 商户API私钥文件
2. `apiclient_cert.pem` - 商户API证书文件（可选）

## 获取证书步骤

1. 登录微信支付商户平台：https://pay.weixin.qq.com/
2. 进入"账户中心" -> "API安全" -> "API证书"
3. 下载商户API证书和私钥文件
4. 将私钥文件重命名为 `apiclient_key.pem` 并放置在此目录

## 注意事项

- 证书文件包含敏感信息，请确保不要提交到版本控制系统
- 建议将 `*.pem` 文件添加到 `.gitignore` 中
- 生产环境请使用环境变量或配置中心管理证书路径 