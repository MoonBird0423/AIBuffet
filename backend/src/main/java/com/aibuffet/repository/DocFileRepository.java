package com.aibuffet.repository;

import com.aibuffet.model.DocFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface DocFileRepository extends JpaRepository<DocFile, Long> {
    DocFile findByMd5Hash(String md5Hash);

    @Lock(LockModeType.PESSIMISTIC_READ)
    Optional<DocFile> findByIdAndStatus(Long id, DocFile.Status status);
    
    @Query(value = """
        SELECT DISTINCT d.* FROM doc_files d 
        INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE kbf.kb_id = :knowledgeBaseId 
        AND d.status = 'ACTIVE'
        ORDER BY d.uploaded_at DESC
        """, 
        countQuery = """
            SELECT COUNT(DISTINCT d.id) FROM doc_files d
            INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id
            WHERE kbf.kb_id = :knowledgeBaseId 
            AND d.status = 'ACTIVE'
            """,
        nativeQuery = true)
    Page<DocFile> findByKbId(Long knowledgeBaseId, Pageable pageable);
}
