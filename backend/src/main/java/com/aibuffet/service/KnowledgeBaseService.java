package com.aibuffet.service;

import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.dto.KnowledgeBaseQuery;
import com.aibuffet.dto.KnowledgeBaseResponse;
import com.aibuffet.model.KnowledgeBase;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;

public interface KnowledgeBaseService {
    KnowledgeBase createKnowledgeBase(CreateKnowledgeBaseRequest request, Long userId);
    
    KnowledgeBaseResponse getKnowledgeBase(Long id);
    
    Page<KnowledgeBaseResponse> findPublicKnowledgeBases(KnowledgeBaseQuery query);
    
    Page<KnowledgeBaseResponse> findMyKnowledgeBases(KnowledgeBaseQuery query, Authentication authentication);
    
    void deleteKnowledgeBase(Long id, Long userId);
}
