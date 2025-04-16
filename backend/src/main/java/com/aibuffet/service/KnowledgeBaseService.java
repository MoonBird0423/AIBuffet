package com.aibuffet.service;

import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.dto.KnowledgeBaseQuery;
import com.aibuffet.dto.KnowledgeBaseResponse;
import com.aibuffet.model.KnowledgeBase;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import java.util.List;

public interface KnowledgeBaseService {
    KnowledgeBase createKnowledgeBase(CreateKnowledgeBaseRequest request, Long userId);
    
    /**
     * 查询用户的知识库（分页）
     * @param query 查询参数
     * @param authentication 认证信息
     * @return 分页结果
     */
    Page<KnowledgeBaseResponse> findMyKnowledgeBases(KnowledgeBaseQuery query, Authentication authentication);
    
    /**
     * 查询公开知识库（分页）
     * @param query 查询参数
     * @return 分页结果
     */
    Page<KnowledgeBaseResponse> findPublicKnowledgeBases(KnowledgeBaseQuery query);
}
