package com.aibuffet.repository;

import com.aibuffet.model.KnowledgeBaseFile;
import com.aibuffet.model.KnowledgeBaseFileId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KnowledgeBaseFileRepository extends JpaRepository<KnowledgeBaseFile, KnowledgeBaseFileId> {
    @Modifying
    @Query("DELETE FROM KnowledgeBaseFile kbf WHERE kbf.fileId = :fileId")
    void deleteByFileId(Long fileId);

    @Modifying
    @Query("DELETE FROM KnowledgeBaseFile kbf WHERE kbf.kbId = :kbId AND kbf.fileId = :fileId")
    void deleteByKbIdAndFileId(Long kbId, Long fileId);

    Optional<KnowledgeBaseFile> findByKbIdAndFileId(Long kbId, Long fileId);

    Optional<KnowledgeBaseFile> findFirstByFileId(Long fileId);

    long countByFileId(Long fileId);

    long countByFileIdAndRelationType(Long fileId, KnowledgeBaseFile.RelationType relationType);
}
