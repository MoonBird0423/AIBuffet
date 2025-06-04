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

    @Column(name = "relation_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RelationType relationType = RelationType.UPLOAD;

    public enum RelationType {
        UPLOAD,
        FAVORITE
    }

    public KnowledgeBaseFile(Long kbId, Long fileId, Long createdBy) {
        this(kbId, fileId, createdBy, RelationType.UPLOAD);
    }

    public KnowledgeBaseFile(Long kbId, Long fileId, Long createdBy, RelationType relationType) {
        this.kbId = kbId;
        this.fileId = fileId;
        this.createdBy = createdBy;
        this.relationType = relationType;
    }
}
