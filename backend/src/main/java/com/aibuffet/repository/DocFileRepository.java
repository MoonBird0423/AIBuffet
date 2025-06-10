package com.aibuffet.repository;

import com.aibuffet.model.DocFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import jakarta.persistence.QueryHint;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import jakarta.transaction.Transactional;

@Repository
public interface DocFileRepository extends JpaRepository<DocFile, Long> {

    // 根据关系类型查询知识库文档
    @Query(value = """
        SELECT d.* FROM doc_files d 
        INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE kbf.kb_id = :knowledgeBaseId 
        AND d.status = 'ACTIVE'
        AND kbf.relation_type = :relationType
        ORDER BY d.uploaded_at DESC
        """, 
        countQuery = """
            SELECT COUNT(DISTINCT d.id) FROM doc_files d
            INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id
            WHERE kbf.kb_id = :knowledgeBaseId 
            AND d.status = 'ACTIVE'
            AND kbf.relation_type = :relationType
            """,
        nativeQuery = true)
    Page<DocFile> findByKbIdAndRelationType(Long knowledgeBaseId, String relationType, Pageable pageable);

    // 根据关系类型和关键词查询知识库文档
    @Query(value = """
        SELECT d.* FROM doc_files d 
        INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE kbf.kb_id = :knowledgeBaseId 
        AND d.status = 'ACTIVE'
        AND kbf.relation_type = :relationType
        AND d.file_name LIKE %:keyword%
        ORDER BY d.uploaded_at DESC
        """, 
        countQuery = """
            SELECT COUNT(DISTINCT d.id) FROM doc_files d
            INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id
            WHERE kbf.kb_id = :knowledgeBaseId 
            AND d.status = 'ACTIVE'
            AND kbf.relation_type = :relationType
            AND d.file_name LIKE %:keyword%
            """,
        nativeQuery = true)
    Page<DocFile> findByKbIdAndRelationTypeAndFileNameContaining(
        Long knowledgeBaseId,
        String relationType,
        String keyword,
        Pageable pageable);

    DocFile findByFileUrl(String fileUrl);
    
    DocFile findByMd5Hash(String md5Hash);

    @Lock(LockModeType.PESSIMISTIC_READ)
    Optional<DocFile> findByIdAndStatus(Long id, DocFile.Status status);
    
    @Query(value = """
        SELECT d.*, COUNT(CASE WHEN kbf2.relation_type = 'FAVORITE' THEN 1 END) as learner_count 
        FROM doc_files d 
        INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        LEFT JOIN knowledge_base_files kbf2 ON d.id = kbf2.file_id
        WHERE kbf.kb_id = :knowledgeBaseId 
        AND d.status = 'ACTIVE'
        GROUP BY d.id, d.file_name, d.file_type, d.file_size, d.file_url, d.uploaded_by,
                d.uploaded_at, d.status, d.md5_hash, d.error_message, d.processing_status,
                d.cover_url, d.category, d.author, d.publish_status, d.description,
                d.extracted_text, d.openai_file_id
        ORDER BY d.uploaded_at DESC
        """, 
        countQuery = """
            SELECT COUNT(DISTINCT d.id) FROM doc_files d
            INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id
            WHERE kbf.kb_id = :knowledgeBaseId 
            AND d.status = 'ACTIVE'
            """,
        nativeQuery = true)
    @QueryHints({@QueryHint(name = "org.hibernate.cacheable", value = "false")})
    Page<DocFile> findByKbId(Long knowledgeBaseId, Pageable pageable);

    // 带关键词和分类的知识库文档查询
    @Query(value = """
        SELECT d.* FROM doc_files d 
        INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE kbf.kb_id = :knowledgeBaseId 
        AND d.status = 'ACTIVE'
        AND d.file_name LIKE %:keyword%
        AND d.category = :category
        ORDER BY d.uploaded_at DESC
        """, 
        countQuery = """
            SELECT COUNT(DISTINCT d.id) FROM doc_files d
            INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id
            WHERE kbf.kb_id = :knowledgeBaseId 
            AND d.status = 'ACTIVE'
            AND d.file_name LIKE %:keyword%
            AND d.category = :category
            """,
        nativeQuery = true)
    Page<DocFile> findByKbIdAndFileNameContainingAndCategory(Long knowledgeBaseId, String keyword, String category, Pageable pageable);

    // 带关键词的知识库文档查询
    @Query(value = """
        SELECT d.* FROM doc_files d 
        INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE kbf.kb_id = :knowledgeBaseId 
        AND d.status = 'ACTIVE'
        AND d.file_name LIKE %:keyword%
        ORDER BY d.uploaded_at DESC
        """, 
        countQuery = """
            SELECT COUNT(DISTINCT d.id) FROM doc_files d
            INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id
            WHERE kbf.kb_id = :knowledgeBaseId 
            AND d.status = 'ACTIVE'
            AND d.file_name LIKE %:keyword%
            """,
        nativeQuery = true)
    Page<DocFile> findByKbIdAndFileNameContaining(Long knowledgeBaseId, String keyword, Pageable pageable);

    // 带分类的知识库文档查询
    @Query(value = """
        SELECT d.*, COUNT(CASE WHEN kbf2.relation_type = 'FAVORITE' THEN 1 END) as learner_count 
        FROM doc_files d 
        INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        LEFT JOIN knowledge_base_files kbf2 ON d.id = kbf2.file_id
        WHERE kbf.kb_id = :knowledgeBaseId 
        AND d.status = 'ACTIVE'
        AND d.category = :category
        GROUP BY d.id, d.file_name, d.file_type, d.file_size, d.file_url, d.uploaded_by,
                d.uploaded_at, d.status, d.md5_hash, d.error_message, d.processing_status,
                d.cover_url, d.category, d.author, d.publish_status, d.description,
                d.extracted_text, d.openai_file_id
        ORDER BY d.uploaded_at DESC
        """, 
        countQuery = """
            SELECT COUNT(DISTINCT d.id) FROM doc_files d
            INNER JOIN knowledge_base_files kbf ON d.id = kbf.file_id
            WHERE kbf.kb_id = :knowledgeBaseId 
            AND d.status = 'ACTIVE'
            AND d.category = :category
            """,
        nativeQuery = true)
    Page<DocFile> findByKbIdAndCategory(Long knowledgeBaseId, String category, Pageable pageable);

    // 以下是公共图书馆查询方法
    
    // 按名称和分类查询已发布文档
    @Query(value = """
        SELECT d.*, COUNT(CASE WHEN kbf.relation_type = 'FAVORITE' THEN 1 END) as learner_count 
        FROM doc_files d 
        LEFT JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE d.status = 'ACTIVE'
        AND d.publish_status = :publishStatus
        AND d.file_name LIKE %:keyword%
        AND d.category = :category
        GROUP BY d.id, d.file_name, d.file_type, d.file_size, d.file_url, d.uploaded_by,
                d.uploaded_at, d.status, d.md5_hash, d.error_message, d.processing_status,
                d.cover_url, d.category, d.author, d.publish_status, d.description,
                d.extracted_text, d.openai_file_id
        ORDER BY d.uploaded_at DESC
        """, 
        nativeQuery = true)
    Page<DocFile> findByFileNameContainingAndCategoryAndPublishStatus(
        String keyword, String category, String publishStatus, Pageable pageable);

    // 按名称查询已发布文档
    @Query(value = """
        SELECT d.*, COUNT(CASE WHEN kbf.relation_type = 'FAVORITE' THEN 1 END) as learner_count 
        FROM doc_files d 
        LEFT JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE d.status = 'ACTIVE'
        AND d.publish_status = :publishStatus
        AND d.file_name LIKE %:keyword%
        GROUP BY d.id, d.file_name, d.file_type, d.file_size, d.file_url, d.uploaded_by,
                d.uploaded_at, d.status, d.md5_hash, d.error_message, d.processing_status,
                d.cover_url, d.category, d.author, d.publish_status, d.description,
                d.extracted_text, d.openai_file_id
        ORDER BY d.uploaded_at DESC
        """, 
        nativeQuery = true)
    Page<DocFile> findByFileNameContainingAndPublishStatus(
        String keyword, String publishStatus, Pageable pageable);

    // 按分类查询已发布文档
    @Query(value = """
        SELECT d.*, COUNT(CASE WHEN kbf.relation_type = 'FAVORITE' THEN 1 END) as learner_count 
        FROM doc_files d 
        LEFT JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE d.status = 'ACTIVE'
        AND d.publish_status = :publishStatus
        AND d.category = :category
        GROUP BY d.id, d.file_name, d.file_type, d.file_size, d.file_url, d.uploaded_by,
                d.uploaded_at, d.status, d.md5_hash, d.error_message, d.processing_status,
                d.cover_url, d.category, d.author, d.publish_status, d.description,
                d.extracted_text, d.openai_file_id
        ORDER BY d.uploaded_at DESC
        """, 
        nativeQuery = true)
    Page<DocFile> findByCategoryAndPublishStatus(
        String category, String publishStatus, Pageable pageable);

    // 查询所有已发布文档
    @Query(value = """
        SELECT d.*, COUNT(CASE WHEN kbf.relation_type = 'FAVORITE' THEN 1 END) as learner_count 
        FROM doc_files d 
        LEFT JOIN knowledge_base_files kbf ON d.id = kbf.file_id 
        WHERE d.status = 'ACTIVE'
        AND d.publish_status = :publishStatus
        GROUP BY d.id, d.file_name, d.file_type, d.file_size, d.file_url, d.uploaded_by,
                d.uploaded_at, d.status, d.md5_hash, d.error_message, d.processing_status,
                d.cover_url, d.category, d.author, d.publish_status, d.description,
                d.extracted_text, d.openai_file_id
        ORDER BY d.uploaded_at DESC
        """, 
        nativeQuery = true)
    Page<DocFile> findByPublishStatus(String publishStatus, Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("UPDATE DocFile d SET d.processingStatus = :status WHERE d.id = :id")
    void updateProcessingStatus(Long id, DocFile.ProcessingStatus status);

    
    @Modifying
    @Transactional
    @Query("UPDATE DocFile d SET d.processingStatus = :status, d.errorMessage = :errorMessage WHERE d.id = :id")
    void updateProcessingStatusAndError(Long id, DocFile.ProcessingStatus status, String errorMessage);
}
