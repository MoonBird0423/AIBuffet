package com.aibuffet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "doc_files")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DocFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "md5_hash")
    private String md5Hash;

    @JsonProperty("error_message")
    @Column(name = "error_message")
    private String errorMessage;

    @JsonProperty("processing_status")
    @Column(name = "processing_status")
    @Enumerated(EnumType.STRING)
    private ProcessingStatus processingStatus = ProcessingStatus.PENDING;

    @Column(name = "cover_url")
    private String coverUrl;

    @Column(name = "category")
    @Enumerated(EnumType.STRING)
    private Category category;

    @Column(name = "favorite_count")
    private Integer favoriteCount = 0;

    @Column(name = "author")
    private String author;

    @Column(name = "publish_status")
    @Enumerated(EnumType.STRING)
    private PublishStatus publishStatus = PublishStatus.UNPUBLISHED;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "openai_file_id")
    private String openaiFileId;

    public enum Status {
        ACTIVE, DELETED
    }

    public enum ProcessingStatus {
        PENDING,         // 待处理
        EXTRACTING_TEXT, // 文本提取中
        CHUNKING,        // 文本分块中
        VECTORIZING,     // 向量化中
        COMPLETED,       // 完成
        FAILED          // 失败
    }

    public enum Category {
        MINDFULNESS("心灵"),
        PERSONAL_GROWTH("个人成长"),
        FAMILY_PARENTING("亲子家庭"),
        HUMANITIES_HISTORY("人文历史"),
        FINANCE("经济理财"),
        COMPUTER("计算机"),
        CAREER_DEVELOPMENT("职场提升"),
        BIOGRAPHY("人物传记"),
        HEALTHY_LIVING("健康生活"),
        PREMIUM_FICTION("精品小说"),
        OTHER("其他");

        private final String displayName;

        Category(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum PublishStatus {
        UNPUBLISHED("未发布"),
        PUBLISHED("已发布");

        private final String displayName;

        PublishStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
