package com.aibuffet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@IdClass(KnowledgeBaseFileId.class)
@Table(name = "knowledge_base_files")
public class KnowledgeBaseFile {
    @Id
    @Column(name = "kb_id")
    private Long kbId;

    @Id
    @Column(name = "file_id")
    private Long fileId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    public KnowledgeBaseFile(Long kbId, Long fileId, Long createdBy) {
        this.kbId = kbId;
        this.fileId = fileId;
        this.createdBy = createdBy;
    }
}
