package com.aibuffet.repository;

import com.aibuffet.model.DocFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface DocFileRepository extends JpaRepository<DocFile, Long> {
    DocFile findByMd5Hash(String md5Hash);
    
    @Query(value = "SELECT d.* FROM doc_files d " +
           "JOIN knowledge_base_files kbf ON d.id = kbf.file_id " +
           "WHERE kbf.kb_id = :knowledgeBaseId AND d.status = 'ACTIVE'", 
           nativeQuery = true)
    Page<DocFile> findByKnowledgeBaseId(Long knowledgeBaseId, Pageable pageable);
}
