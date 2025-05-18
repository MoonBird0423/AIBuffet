package com.aibuffet.repository;

import com.aibuffet.model.DocInterpretation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocInterpretationRepository extends JpaRepository<DocInterpretation, Long> {
    /**
     * 根据文档ID查找解读内容
     * @param docId 文档ID
     * @return 解读内容
     */
    Optional<DocInterpretation> findByDocId(Long docId);
}
