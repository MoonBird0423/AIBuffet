# Milvus向量数据库部署指南

## 目录结构

```
backend/milvus/
├── docker-compose.yml
└── volumes/
    ├── etcd/     # etcd元数据存储
    ├── minio/    # MinIO对象存储
    └── milvus/   # Milvus数据文件
```

## 部署步骤

### 1. 前置条件

- 安装Docker Desktop
- 确保Docker服务正在运行
- 以管理员模式运行PowerShell或命令提示符

### 2. 启动服务

在项目根目录下执行：

```bash
docker compose -f backend/milvus/docker-compose.yml up -d
```

查看服务状态：

```bash
docker compose -f backend/milvus/docker-compose.yml ps
```

### 3. 服务配置

#### Milvus服务
- 主服务端口：19530
- 默认认证：root:Milvus
- Web端口：9091

#### MinIO服务
- API端口：9000
- 控制台端口：9001
- 访问凭据：
  - Access Key: minioadmin
  - Secret Key: minioadmin

#### Etcd服务
- 仅内部使用，不对外暴露端口

## Spring Boot配置

Milvus的Spring Boot配置位于`backend/src/main/java/com/aibuffet/config/MilvusConfig.java`：

```java
@Configuration
public class MilvusConfig {
    @Value("${milvus.uri:http://localhost:19530}")
    private String uri;
    
    @Value("${milvus.token:root:Milvus}")
    private String token;
    
    @Bean
    public MilvusClientV2 milvusClient() {
        ConnectConfig connectConfig = ConnectConfig.builder()
            .uri(uri)
            .token(token)
            .build();
        
        return new MilvusClientV2(connectConfig);
    }
}
```

## 数据持久化

所有数据都持久化存储在`backend/milvus/volumes/`目录下：

- `volumes/etcd/`: 存储Milvus的元数据
- `volumes/minio/`: 存储向量数据文件
- `volumes/milvus/`: 存储Milvus的系统数据

## 常用操作命令

### 服务管理

```bash
# 启动服务
docker compose -f backend/milvus/docker-compose.yml up -d

# 停止服务
docker compose -f backend/milvus/docker-compose.yml down

# 查看服务状态
docker compose -f backend/milvus/docker-compose.yml ps

# 查看服务日志
docker compose -f backend/milvus/docker-compose.yml logs

# 查看特定服务日志（例如milvus-standalone）
docker compose -f backend/milvus/docker-compose.yml logs milvus-standalone
```

### 服务访问

- Milvus服务：http://localhost:19530
- MinIO控制台：http://localhost:9001

## 故障排除

1. 服务无法启动
   - 检查Docker Desktop是否正在运行
   - 确保没有其他服务占用相关端口
   - 查看服务日志获取详细错误信息

2. 连接失败
   - 验证服务状态是否正常
   - 检查Spring Boot配置中的连接参数
   - 确认防火墙设置不会阻止连接

3. 数据持久化问题
   - 确保volumes目录具有正确的权限
   - 检查磁盘空间是否充足

## 注意事项

1. 在开发环境中，服务默认使用HTTP连接，生产环境建议配置HTTPS
2. MinIO的默认凭据仅用于开发环境，生产环境必须修改
3. 定期备份volumes目录以防止数据丢失
4. 监控系统资源使用情况，特别是在处理大量向量数据时
