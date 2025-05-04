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

    public enum Status {
        ACTIVE, DELETED
    }

    public enum ProcessingStatus {
        PENDING, CHUNKING, VECTORIZING, COMPLETED, FAILED
    }
}
