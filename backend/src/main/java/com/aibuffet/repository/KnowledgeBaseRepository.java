package com.aibuffet.repository;

import com.aibuffet.model.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {
    List<KnowledgeBase> findByCreatedByAndStatusOrderByCreatedAtDesc(Long userId, KnowledgeBase.Status status);
    
    List<KnowledgeBase> findByVisibilityAndStatusOrderByUsageCountDesc(KnowledgeBase.Visibility visibility, KnowledgeBase.Status status);
    
    List<KnowledgeBase> findByCategoryAndVisibilityAndStatusOrderByCreatedAtDesc(String category, KnowledgeBase.Visibility visibility, KnowledgeBase.Status status);
}
