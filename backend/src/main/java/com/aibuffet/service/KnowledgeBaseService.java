package com.aibuffet.service;

import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.model.KnowledgeBase;
import java.util.List;

public interface KnowledgeBaseService {
    KnowledgeBase createKnowledgeBase(CreateKnowledgeBaseRequest request, Long userId);
    
    List<KnowledgeBase> getMyKnowledgeBases(Long userId);
    
    List<KnowledgeBase> getPublicKnowledgeBases();
    
    List<KnowledgeBase> getKnowledgeBasesByCategory(String category);
}
