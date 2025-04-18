package com.aibuffet.repository;

import com.aibuffet.model.KnowledgeBaseFile;
import com.aibuffet.model.KnowledgeBaseFileId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface KnowledgeBaseFileRepository extends JpaRepository<KnowledgeBaseFile, KnowledgeBaseFileId> {
    @Modifying
    @Query("DELETE FROM KnowledgeBaseFile kbf WHERE kbf.fileId = :fileId")
    void deleteByFileId(Long fileId);
}
