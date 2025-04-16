package com.aibuffet.service.impl;

import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.model.KnowledgeBase;
import com.aibuffet.repository.KnowledgeBaseRepository;
import com.aibuffet.service.KnowledgeBaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {

    @Autowired
    private KnowledgeBaseRepository knowledgeBaseRepository;

    @Override
    @Transactional
    public KnowledgeBase createKnowledgeBase(CreateKnowledgeBaseRequest request, Long userId) {
        KnowledgeBase knowledgeBase = new KnowledgeBase();
        knowledgeBase.setName(request.getName());
        knowledgeBase.setDescription(request.getDescription());
        knowledgeBase.setVisibility(request.getVisibility());
        knowledgeBase.setCategory(request.getCategory());
        knowledgeBase.setColorMark(request.getColorMark());
        knowledgeBase.setCreatedBy(userId);
        knowledgeBase.setStatus(KnowledgeBase.Status.ACTIVE);
        
        return knowledgeBaseRepository.save(knowledgeBase);
    }

    @Override
    public List<KnowledgeBase> getMyKnowledgeBases(Long userId) {
        return knowledgeBaseRepository.findByCreatedByAndStatusOrderByCreatedAtDesc(
            userId, 
            KnowledgeBase.Status.ACTIVE
        );
    }

    @Override
    public List<KnowledgeBase> getPublicKnowledgeBases() {
        return knowledgeBaseRepository.findByVisibilityAndStatusOrderByUsageCountDesc(
            KnowledgeBase.Visibility.PUBLIC,
            KnowledgeBase.Status.ACTIVE
        );
    }

    @Override
    public List<KnowledgeBase> getKnowledgeBasesByCategory(String category) {
        return knowledgeBaseRepository.findByCategoryAndVisibilityAndStatusOrderByCreatedAtDesc(
            category,
            KnowledgeBase.Visibility.PUBLIC,
            KnowledgeBase.Status.ACTIVE
        );
    }
}
