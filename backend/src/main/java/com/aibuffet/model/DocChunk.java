package com.aibuffet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Entity
@Table(name = "doc_chunks")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocChunk {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "file_id", nullable = false)
    private Long fileId;
    
    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(name = "token_count")
    private Integer tokenCount;
    
    @Column(name = "vector_id", length = 100)
    private String vectorId;
    
    @Column(columnDefinition = "json")
    private String metadata;
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public void setMetadataMap(Map<String, Object> metadataMap) {
        try {
            this.metadata = objectMapper.writeValueAsString(metadataMap);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize metadata", e);
        }
    }
    
    public Map<String, Object> getMetadataMap() {
        try {
            if (this.metadata == null) return null;
            return objectMapper.readValue(this.metadata, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize metadata", e);
        }
    }
    
    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "vector_status", length = 20)
    private String vectorStatus = VectorStatus.PENDING;
    
    @Column(name = "vector_error", columnDefinition = "TEXT")
    private String vectorError;
    
    @Column(name = "retry_count")
    private Integer retryCount = 0;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", insertable = false, updatable = false)
    private DocFile docFile;
    
    // 辅助方法
    public void incrementRetryCount() {
        this.retryCount = (this.retryCount == null ? 0 : this.retryCount) + 1;
    }
    
    public void resetForRetry() {
        this.retryCount = 0;
        this.vectorError = null;
        this.vectorStatus = VectorStatus.PENDING;
    }
    
    public void updateVectorStatus(String status, String error) {
        this.vectorStatus = status;
        this.vectorError = error;
    }
    
    public void setVectorComplete(String vectorId) {
        this.vectorId = vectorId;
        this.vectorStatus = VectorStatus.COMPLETED;
        this.vectorError = null;
    }
}
