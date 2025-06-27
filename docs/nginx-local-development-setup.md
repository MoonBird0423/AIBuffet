# 本地Nginx开发环境配置指南

## 概述

本文档介绍如何在本地开发环境中配置Nginx，实现与生产环境一致的域名访问和WebSocket代理。

## 配置目标

- 本地访问 `http://lovesuyi.cn` 时，通过Nginx代理到前端开发服务器
- WebSocket连接 `ws://lovesuyi.cn/ws/chat/completions` 代理到后端
- API请求 `http://lovesuyi.cn/api/` 代理到后端
- 与生产环境保持一致的访问方式

## 安装步骤

### 1. 下载并解压Nginx

```bash
# 下载Nginx
curl -o nginx.zip https://nginx.org/download/nginx-1.24.0.zip

# 解压到项目根目录
unzip nginx.zip
```

### 2. 修改hosts文件

以管理员身份运行记事本，打开 `C:\Windows\System32\drivers\etc\hosts`，在文件末尾添加：

```
127.0.0.1 lovesuyi.cn
```

### 3. 配置Nginx

修改 `nginx-1.24.0/conf/nginx.conf` 文件：

```nginx
#user  nobody;
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  lovesuyi.cn;
        
        # WebSocket代理
        location /ws/ {
            proxy_pass http://127.0.0.1:8080/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 600s;
            proxy_send_timeout 600s;
        }
        
        # API代理
        location /api/ {
            proxy_pass http://127.0.0.1:8080/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_read_timeout 600s;
            proxy_send_timeout 600s;
        }
        
        # 前端静态文件代理
        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 支持WebSocket升级
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

## 启动和使用

### 1. 启动Nginx

```bash
cd nginx-1.24.0
./nginx.exe
```

### 2. 启动后端服务

```bash
# 在项目根目录
java -jar backend/target/aibuffet-backend.jar
# 或者使用IDE启动Spring Boot应用
```

### 3. 启动前端开发服务器

```bash
cd frontend
npm start
```

### 4. 访问应用

打开浏览器访问：`http://lovesuyi.cn`

## 验证配置

### 1. 检查Nginx是否启动

```bash
curl -I http://lovesuyi.cn
```

应该返回200状态码。

### 2. 检查WebSocket代理

```bash
curl -I http://lovesuyi.cn/ws/chat/completions
```

应该返回401状态码（需要认证，说明代理正常）。

### 3. 检查API代理

```bash
curl -I http://lovesuyi.cn/api/auth/captcha
```

应该返回200状态码。

## 常用命令

### 启动Nginx
```bash
cd nginx-1.24.0
./nginx.exe
```

### 停止Nginx
```bash
cd nginx-1.24.0
./nginx.exe -s stop
```

### 重新加载配置
```bash
cd nginx-1.24.0
./nginx.exe -s reload
```

### 检查配置语法
```bash
cd nginx-1.24.0
./nginx.exe -t
```

## 故障排除

### 1. 端口被占用

如果80端口被占用，可以修改nginx.conf中的端口：

```nginx
server {
    listen       8081;  # 改为其他端口
    server_name  lovesuyi.cn;
    # ...
}
```

然后访问 `http://lovesuyi.cn:8081`

### 2. hosts文件修改失败

确保以管理员身份运行记事本，或者使用以下命令：

```bash
# 在Git Bash中（需要管理员权限）
echo "127.0.0.1 lovesuyi.cn" >> /c/Windows/System32/drivers/etc/hosts
```

### 3. WebSocket连接失败

检查：
- 后端是否在8080端口启动
- Nginx配置中的WebSocket代理是否正确
- 浏览器控制台是否有错误信息

### 4. 前端无法访问

检查：
- 前端是否在3000端口启动
- Nginx配置中的前端代理是否正确
- 浏览器控制台是否有错误信息

## 生产环境配置

生产环境的Nginx配置请参考服务器上的配置文件，主要区别：

1. **SSL证书配置**：生产环境使用HTTPS
2. **静态文件服务**：生产环境直接服务前端构建文件
3. **安全配置**：生产环境有更多的安全限制

## 注意事项

1. **开发环境专用**：此配置仅用于本地开发，不要用于生产环境
2. **端口冲突**：确保80、3000、8080端口没有被其他程序占用
3. **权限问题**：修改hosts文件需要管理员权限
4. **防火墙**：确保Windows防火墙允许Nginx访问网络

## 相关文件

- `nginx-1.24.0/conf/nginx.conf` - Nginx主配置文件
- `frontend/src/services/api.js` - 前端WebSocket配置
- `backend/src/main/java/com/aibuffet/controller/ChatCompletionWebSocketHandler.java` - 后端WebSocket处理器 