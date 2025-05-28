package com.aibuffet.dto;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SearchRequest {
    @NotNull(message = "检索内容不能为空")
    @Size(min = 1, max = 1000, message = "检索内容长度必须在1-1000字符之间")
    private String query;

    // 原有的多知识库搜索（保持兼容性）
    private List<Long> knowledgeBaseIds;
    
    // 新增：单个知识库搜索
    private Long knowledgeBaseId;
    
    // 新增：文档搜索
    private Long documentId;

    private Integer limit = 10;
    private Float similarityThreshold = 0.7f;
    
    // 搜索类型枚举
    public enum SearchType {
        KNOWLEDGE_BASE,    // 知识库搜索
        DOCUMENT,         // 文档搜索
        LEGACY            // 原有的多知识库搜索（兼容性）
    }

    // 验证：确保只传入一种搜索类型
    public boolean isValid() {
        int typeCount = 0;
        if (knowledgeBaseIds != null && !knowledgeBaseIds.isEmpty()) typeCount++;
        if (knowledgeBaseId != null) typeCount++;
        if (documentId != null) typeCount++;
        return typeCount == 1;
    }
    
    // 自动判断搜索类型
    public SearchType getSearchType() {
        if (documentId != null) {
            return SearchType.DOCUMENT;
        } else if (knowledgeBaseId != null) {
            return SearchType.KNOWLEDGE_BASE;
        } else if (knowledgeBaseIds != null && !knowledgeBaseIds.isEmpty()) {
            return SearchType.LEGACY;
        }
        return null;
    }

    // Getters and setters
    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public List<Long> getKnowledgeBaseIds() {
        return knowledgeBaseIds;
    }

    public void setKnowledgeBaseIds(List<Long> knowledgeBaseIds) {
        this.knowledgeBaseIds = knowledgeBaseIds;
    }

    public Long getKnowledgeBaseId() {
        return knowledgeBaseId;
    }

    public void setKnowledgeBaseId(Long knowledgeBaseId) {
        this.knowledgeBaseId = knowledgeBaseId;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }

    public Float getSimilarityThreshold() {
        return similarityThreshold;
    }

    public void setSimilarityThreshold(Float similarityThreshold) {
        this.similarityThreshold = similarityThreshold;
    }
}
