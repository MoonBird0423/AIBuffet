package com.aibuffet.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "doc_files")
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

    @Column(name = "parse_status")
    @Enumerated(EnumType.STRING)
    private ParseStatus parseStatus = ParseStatus.PENDING;

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

    public enum ParseStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }

    public enum Status {
        ACTIVE, DELETED
    }
}
