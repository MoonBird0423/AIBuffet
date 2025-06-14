package com.aibuffet.repository;

import com.aibuffet.model.KnowledgeBaseFile;
import com.aibuffet.model.KnowledgeBaseFileId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    // 新增：根据文档ID和创建者查询第一个关联关系
    Optional<KnowledgeBaseFile> findFirstByFileIdAndCreatedBy(Long fileId, Long createdBy);

    // 新增：根据文档ID和创建者查询所有关联关系
    List<KnowledgeBaseFile> findByFileIdAndCreatedBy(Long fileId, Long createdBy);

    long countByFileId(Long fileId);

    long countByFileIdAndRelationType(Long fileId, KnowledgeBaseFile.RelationType relationType);
}
