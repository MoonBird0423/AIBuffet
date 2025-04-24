package com.aibuffet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vector_status", length = 20)
    private VectorStatus vectorStatus = VectorStatus.PENDING;
    
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
    
    public void updateVectorStatus(VectorStatus status, String error) {
        this.vectorStatus = status;
        this.vectorError = error;
    }
    
    public void setVectorComplete(String vectorId) {
        this.vectorId = vectorId;
        this.vectorStatus = VectorStatus.COMPLETED;
        this.vectorError = null;
    }
}
