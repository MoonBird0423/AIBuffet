package com.aibuffet.service;

import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.dto.KnowledgeBaseQuery;
import com.aibuffet.dto.KnowledgeBaseResponse;
import com.aibuffet.model.KnowledgeBase;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;

public interface KnowledgeBaseService {
    /**
     * 更新知识库
     *
     * @param id 知识库ID
     * @param request 更新请求
     * @param userId 用户ID
     * @return 更新后的知识库
     */
    KnowledgeBase updateKnowledgeBase(Long id, CreateKnowledgeBaseRequest request, Long userId);

    KnowledgeBase createKnowledgeBase(CreateKnowledgeBaseRequest request, Long userId);
    
    KnowledgeBaseResponse getKnowledgeBase(Long id);
    
    Page<KnowledgeBaseResponse> findKnowledgeBases(KnowledgeBaseQuery query);
    
    Page<KnowledgeBaseResponse> findMyKnowledgeBases(KnowledgeBaseQuery query, Authentication authentication);
    
    void deleteKnowledgeBase(Long id, Long userId);
}
