package com.aibuffet.repository;

import com.aibuffet.model.DocChunk;
import com.aibuffet.model.VectorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface DocChunkRepository extends JpaRepository<DocChunk, Long> {
    
    List<DocChunk> findByFileIdAndVectorStatus(Long fileId, String status);
    
    @Query("SELECT COUNT(c) FROM DocChunk c WHERE c.fileId = :fileId AND c.vectorStatus = :status")
    long countByFileIdAndStatus(Long fileId, String status);
    
    @Query("SELECT COUNT(c) FROM DocChunk c WHERE c.fileId = :fileId")
    long countByFileId(Long fileId);
    
    @Modifying
    @Query("UPDATE DocChunk c SET c.vectorStatus = :status, c.vectorError = :error WHERE c.id = :chunkId")
    void updateStatus(Long chunkId, String status, String error);
    
    @Modifying
    @Query("UPDATE DocChunk c SET c.vectorId = :vectorId, c.vectorStatus = :status, c.vectorError = NULL WHERE c.id = :chunkId")
    void setVectorComplete(Long chunkId, String vectorId, String status);
    
    // 修正方法名称以匹配实体类中的字段名
    List<DocChunk> findByFileIdOrderByChunkIndexAsc(Long fileId);
    
    @Query("""
        SELECT NEW map(
            c.vectorStatus as status,
            COUNT(c) as count
        )
        FROM DocChunk c
        WHERE c.fileId = :fileId
        GROUP BY c.vectorStatus
    """)
    List<Map<String, Object>> getProcessingStatusByFileId(Long fileId);
}
