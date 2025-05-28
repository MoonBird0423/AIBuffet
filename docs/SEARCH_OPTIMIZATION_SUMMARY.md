# 搜索服务优化总结

## 概述

本次优化为搜索服务增加了对单个知识库和单个文档的搜索支持，使搜索功能更加灵活和精准。

## 功能增强

### 1. 新增搜索类型

- **知识库搜索**：传入单个知识库ID进行检索
- **文档搜索**：传入单个文档ID进行检索
- **兼容性**：保持原有的多知识库搜索功能

### 2. 权限控制优化

- **知识库权限**：验证用户是否为知识库的创建者
- **文档权限**：验证文档是否已发布或用户是否为文档上传者
- **精确控制**：根据搜索类型进行相应的权限验证

## 技术实现

### 后端修改

#### 1. SearchRequest DTO
```java
public class SearchRequest {
    private String query;
    
    // 原有的多知识库搜索（保持兼容性）
    private List<Long> knowledgeBaseIds;
    
    // 新增：单个知识库搜索
    private Long knowledgeBaseId;
    
    // 新增：文档搜索
    private Long documentId;
    
    // 搜索类型枚举
    public enum SearchType {
        KNOWLEDGE_BASE,    // 知识库搜索
        DOCUMENT,         // 文档搜索
        LEGACY            // 原有的多知识库搜索（兼容性）
    }
    
    // 验证方法
    public boolean isValid() {
        int typeCount = 0;
        if (knowledgeBaseIds != null && !knowledgeBaseIds.isEmpty()) typeCount++;
        if (knowledgeBaseId != null) typeCount++;
        if (documentId != null) typeCount++;
        return typeCount == 1;
    }
    
    // 自动判断搜索类型
    public SearchType getSearchType() {
        if (documentId != null) return SearchType.DOCUMENT;
        else if (knowledgeBaseId != null) return SearchType.KNOWLEDGE_BASE;
        else if (knowledgeBaseIds != null && !knowledgeBaseIds.isEmpty()) return SearchType.LEGACY;
        return null;
    }
}
```

#### 2. SearchService 接口扩展
```java
public interface SearchService {
    List<SearchResult> search(SearchRequest request);
    
    // 原有权限验证
    boolean validateSearchPermission(List<Long> knowledgeBaseIds, Long userId);
    
    // 新增权限验证
    boolean validateKnowledgeBasePermission(Long knowledgeBaseId, Long userId);
    boolean validateDocumentPermission(Long documentId, Long userId);
}
```

#### 3. SearchServiceImpl 核心优化
- **智能路由**：根据搜索类型自动选择处理逻辑
- **文件ID获取**：针对不同搜索类型获取相应的文件ID列表
- **权限验证**：分别实现知识库和文档的权限验证

#### 4. SearchController 更新
- **参数验证**：确保请求参数的有效性
- **权限检查**：根据搜索类型进行相应的权限验证
- **统一入口**：保持API接口的一致性

### 前端修改

#### 新增API方法
```javascript
// 知识库搜索
export const searchKnowledgeBase = async (knowledgeBaseId, query, limit = 10, threshold = 0.7) => {
  const response = await apiClient.post('/search', {
    query: query,
    knowledgeBaseId: knowledgeBaseId,
    limit: limit,
    similarityThreshold: threshold
  });
  return response.data;
};

// 文档搜索
export const searchDocument = async (documentId, query, limit = 10, threshold = 0.7) => {
  const response = await apiClient.post('/search', {
    query: query,
    documentId: documentId,
    limit: limit,
    similarityThreshold: threshold
  });
  return response.data;
};
```

## 使用示例

### 1. 知识库搜索
```javascript
import { searchKnowledgeBase } from '../services/api';

const handleKnowledgeBaseSearch = async () => {
  try {
    const results = await searchKnowledgeBase(123, "人工智能", 10, 0.7);
    console.log('知识库搜索结果:', results);
  } catch (error) {
    console.error('搜索失败:', error);
  }
};
```

### 2. 文档搜索
```javascript
import { searchDocument } from '../services/api';

const handleDocumentSearch = async () => {
  try {
    const results = await searchDocument(456, "机器学习", 5, 0.8);
    console.log('文档搜索结果:', results);
  } catch (error) {
    console.error('搜索失败:', error);
  }
};
```

### 3. 原有多知识库搜索（兼容性）
```javascript
import apiClient from '../services/api';

const handleLegacySearch = async () => {
  try {
    const response = await apiClient.post('/search', {
      query: "深度学习",
      knowledgeBaseIds: [123, 456, 789],
      limit: 10,
      similarityThreshold: 0.7
    });
    console.log('多知识库搜索结果:', response.data);
  } catch (error) {
    console.error('搜索失败:', error);
  }
};
```

## 权限说明

### 知识库搜索权限
- 用户必须是知识库的创建者
- SQL: `kb.created_by = :userId`

### 文档搜索权限
- 文档已发布（公开访问）OR 用户是文档的上传者
- SQL: `df.publish_status = 'PUBLISHED' OR df.uploaded_by = :userId`

### 多知识库搜索权限（兼容性）
- 知识库为公开状态 OR 用户是知识库创建者
- SQL: `kb.visibility = 'PUBLIC' OR kb.created_by = :userId`

## 性能优化

1. **精确搜索范围**：文档搜索时直接定位到单个文档，避免跨知识库查询
2. **索引利用**：充分利用数据库索引提升查询性能
3. **内存优化**：减少不必要的数据加载和处理

## 兼容性

- **向后兼容**：原有的多知识库搜索功能保持不变
- **API一致性**：使用同一个搜索端点，根据参数自动路由
- **数据结构兼容**：SearchResult返回格式保持不变

## 测试验证

### 编译测试
```bash
cd backend && mvn compile
# BUILD SUCCESS - 编译通过
```

### 功能测试建议
1. 测试单个知识库搜索功能
2. 测试单个文档搜索功能
3. 验证权限控制的正确性
4. 确保原有功能的兼容性
5. 性能测试（响应时间、并发处理）

## 总结

本次优化成功实现了：
- ✅ 单个知识库搜索功能
- ✅ 单个文档搜索功能
- ✅ 精确的权限控制
- ✅ 向后兼容性
- ✅ 统一的API接口
- ✅ 代码编译通过

搜索服务现在支持更灵活的搜索模式，用户可以根据需要选择合适的搜索范围，同时保持了良好的性能和安全性。
