package com.aibuffet.service;

import com.aibuffet.dto.SearchRequest;
import com.aibuffet.dto.SearchResult;
import java.util.List;

public interface SearchService {
    /**
     * 在指定知识库中执行内容检索
     *
     * @param request 检索请求，包含查询内容和知识库范围
     * @return 检索结果列表，按相似度降序排序
     */
    List<SearchResult> search(SearchRequest request);

    /**
     * 验证用户是否有权限检索指定的知识库
     *
     * @param knowledgeBaseIds 知识库ID列表
     * @param userId 用户ID
     * @return true如果用户有权限访问所有指定的知识库
     */
    boolean validateSearchPermission(List<Long> knowledgeBaseIds, Long userId);
}
