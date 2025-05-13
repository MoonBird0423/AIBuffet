package com.aibuffet.repository;

import com.aibuffet.model.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long>, JpaSpecificationExecutor<KnowledgeBase> {
    List<KnowledgeBase> findByCreatedByOrderByCreatedAtDesc(Long userId);
}
