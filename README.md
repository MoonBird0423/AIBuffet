# 书意平台

**一句话总结：** 书意平台是一个基于AI的智能知识管理平台，让用户通过上传文档、智能对话、语音解读等方式快速构建个人知识库，实现"30分钟读懂一本书"的高效学习体验。

## 📖 项目介绍

书意平台是一个前后端分离的智能知识管理平台，专注于为新手用户提供AI学习的第一站体验。平台集成了文档处理、向量搜索、智能对话、语音合成等AI技术，让用户能够快速从文档中提取知识，并通过多种方式进行学习和理解。

### 核心价值
- **降低AI学习门槛**：手机号即可注册，无需复杂设置
- **提升学习效率**：AI解读、脑图、测试等多维度学习方式
- **个性化知识管理**：个人知识库，专属学习空间
- **智能内容生成**：自动生成解读、脑图、测试题等

## 🏗️ 项目结构

```
cusortest/
├── frontend/                 # React前端项目
│   ├── src/
│   │   ├── components/      # 组件库
│   │   │   ├── auth/       # 认证相关组件
│   │   │   ├── chat/       # 聊天功能组件
│   │   │   ├── common/     # 通用组件
│   │   │   ├── knowledge/  # 知识库组件
│   │   │   ├── layout/     # 布局组件
│   │   │   └── library/    # 图书馆组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── contexts/       # React Context
│   │   └── utils/          # 工具函数
│   ├── public/             # 静态资源
│   └── package.json
├── backend/                 # Spring Boot后端项目
│   ├── src/main/java/com/aibuffet/
│   │   ├── controller/     # 控制器层
│   │   ├── service/        # 服务层
│   │   ├── model/          # 数据模型
│   │   ├── repository/     # 数据访问层
│   │   ├── config/         # 配置类
│   │   ├── security/       # 安全相关
│   │   └── dto/           # 数据传输对象
│   ├── src/main/resources/ # 配置文件
│   └── pom.xml
├── docs/                   # 项目文档
├── nginx-1.24.0/          # Nginx配置
└── milvus/                # 向量数据库配置
```

## 🚀 核心功能

### 🏠 首页 (Home)
- **产品展示**：轮播展示四大核心功能（知识问答、语音解读、知识脑图、知识测试）
- **功能介绍**：详细介绍平台的核心价值和使用方式
- **快速入口**：提供浏览图书和上传图书的快捷入口

### 📚 图书馆 (Library)
- **图书浏览**：展示所有已发布的图书
- **智能搜索**：支持关键词搜索和分类筛选
- **无限滚动**：分页加载，支持大量图书的高效浏览
- **图书卡片**：展示图书基本信息、收藏数量等

### 📖 图书详情 (BookDetails)
- **多标签内容**：语音解读、知识脑图、知识测试三个核心功能
- **音频播放**：支持AI生成的语音解读播放
- **内容缓存**：智能缓存已加载的内容，提升用户体验
- **分享功能**：支持图书链接分享

### 💬 AI对话 (Chat)
- **智能对话**：基于WebSocket的实时对话体验
- **提问对象**：支持针对特定图书或知识库进行对话
- **会话管理**：完整的聊天历史记录和会话状态管理
- **流式响应**：实时显示AI回复内容

### 🗂️ 我的知识库 (MyKnowledge)
- **知识库管理**：创建、编辑、删除个人知识库
- **文档上传**：支持多种格式文档的批量上传
- **文档处理**：自动文本提取、分块、向量化
- **权限控制**：精确的文档访问权限管理

### 👤 用户系统
- **手机验证码登录**：简化注册流程，新用户自动创建账户
- **JWT身份认证**：安全可靠的用户会话管理
- **用户信息管理**：支持头像上传、用户名修改等个性化设置

## 🛠️ 技术架构

### 后端技术栈
- **Spring Boot 3.x**：现代化的Java应用框架
- **Spring Security**：完善的安全认证体系
- **Spring Data JPA**：数据持久化层
- **Milvus向量数据库**：高性能向量检索
- **MySQL**：关系型数据存储
- **Redis**：缓存和会话管理
- **阿里云OSS**：对象存储服务

### 前端技术栈
- **React 18**：现代化的前端框架
- **Tailwind CSS**：原子化CSS框架
- **WebSocket**：实时通信支持
- **React Router**：单页应用路由
- **Context API**：状态管理

### 核心服务
- **文档处理服务**：文本提取、分块、向量化
- **搜索服务**：基于向量数据库的语义搜索
- **对话服务**：WebSocket实时对话
- **音频服务**：AI语音合成
- **内容生成服务**：脑图、测试题生成

## 🚀 开发指南

### 环境要求
- Java 17+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+
- Milvus 2.3+

### 快速启动

#### 1. 克隆项目
```bash
git clone <repository-url>
cd cusortest
```

#### 2. 后端启动
```bash
cd backend
# 使用Maven Wrapper启动
./mvnw spring-boot:run

# 或者使用IDE启动Spring Boot应用
```

#### 3. 前端启动
```bash
cd frontend
# 安装依赖
npm install

# 启动开发服务器
npm start
```

#### 4. 访问应用
打开浏览器访问：`http://localhost:3000`

### 开发配置

#### 数据库配置
在 `backend/src/main/resources/application.properties` 中配置数据库连接：
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/aibuffet
spring.datasource.username=your_username
spring.datasource.password=your_password
```

#### 向量数据库配置
启动Milvus服务：
```bash
cd backend/milvus
docker-compose up -d
```

#### 阿里云OSS配置
在配置文件中设置OSS相关参数：
```properties
aliyun.oss.endpoint=your_endpoint
aliyun.oss.accessKeyId=your_access_key_id
aliyun.oss.accessKeySecret=your_access_key_secret
aliyun.oss.bucketName=your_bucket_name
```

## 🚀 部署指南

### 生产环境部署

#### 1. 后端部署
```bash
cd backend
# 打包应用
./mvnw clean package -DskipTests

# 运行JAR文件
java -jar target/aibuffet-0.0.1-SNAPSHOT.jar
```

#### 2. 前端部署
```bash
cd frontend
# 安装依赖
npm install

# 构建生产版本
npm run build

# 部署到Web服务器
# 将build目录内容部署到Nginx或其他Web服务器
```

#### 3. Nginx配置
使用项目中的Nginx配置：
```bash
# 复制配置文件
cp nginx-1.24.0/conf/nginx.conf /etc/nginx/nginx.conf

# 重启Nginx
nginx -s reload
```

### Docker部署
```bash
# 构建后端镜像
cd backend
docker build -t aibuffet-backend .

# 构建前端镜像
cd frontend
docker build -t aibuffet-frontend .

# 启动服务
docker-compose up -d
```

### 环境变量配置
生产环境需要配置以下环境变量：
```bash
# 数据库配置
DB_HOST=your_db_host
DB_PORT=3306
DB_NAME=aibuffet
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=your_redis_host
REDIS_PORT=6379

# 阿里云OSS配置
OSS_ENDPOINT=your_endpoint
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=your_bucket_name

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=86400000
```

## 📚 相关文档

- [权限说明](./docs/权限说明.md) - 详细的权限控制说明
- [Milvus配置指南](./docs/milvus-setup-guide.md) - 向量数据库配置
- [短信配置指南](./docs/sms-configuration-guide.md) - 短信服务配置
- [WebSocket修复总结](./docs/WEBSOCKET_FIX_SUMMARY.md) - WebSocket相关问题解决
- [搜索优化总结](./docs/SEARCH_OPTIMIZATION_SUMMARY.md) - 搜索功能优化记录

如有问题或建议，请通过以下方式联系：
- 邮箱：1597826406@qq.com

---

**AIBuffet** - 让AI学习变得简单，让知识管理变得智能！🎉
