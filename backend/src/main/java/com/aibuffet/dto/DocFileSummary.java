package com.aibuffet.dto;

import com.aibuffet.model.DocFile;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DocFileSummary {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileUrl;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
    private String coverUrl;
    private DocFile.Category category;
    private Integer favoriteCount;
    private String author;
    private DocFile.PublishStatus publishStatus;
    private String description;
    private DocFile.ProcessingStatus processingStatus;

    // 用于投影查询的构造函数
    public DocFileSummary(
        Long id,
        String fileName,
        String fileType,
        Long fileSize,
        String fileUrl,
        Long uploadedBy,
        LocalDateTime uploadedAt,
        String coverUrl,
        DocFile.Category category,
        Integer favoriteCount,
        String author,
        DocFile.PublishStatus publishStatus,
        String description,
        DocFile.ProcessingStatus processingStatus
    ) {
        this.id = id;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.fileUrl = fileUrl;
        this.uploadedBy = uploadedBy;
        this.uploadedAt = uploadedAt;
        this.coverUrl = coverUrl;
        this.category = category;
        this.favoriteCount = favoriteCount;
        this.author = author;
        this.publishStatus = publishStatus;
        this.description = description;
        this.processingStatus = processingStatus;
    }

    // 用于DocFile转换的构造函数
    public DocFileSummary(DocFile docFile) {
        this.id = docFile.getId();
        this.fileName = docFile.getFileName();
        this.fileType = docFile.getFileType();
        this.fileSize = docFile.getFileSize();
        this.fileUrl = docFile.getFileUrl();
        this.uploadedBy = docFile.getUploadedBy();
        this.uploadedAt = docFile.getUploadedAt();
        this.coverUrl = docFile.getCoverUrl();
        this.category = docFile.getCategory();
        this.favoriteCount = docFile.getFavoriteCount();
        this.author = docFile.getAuthor();
        this.publishStatus = docFile.getPublishStatus();
        this.description = docFile.getDescription();
        this.processingStatus = docFile.getProcessingStatus();
    }
}
