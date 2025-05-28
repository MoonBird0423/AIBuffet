package com.aibuffet.model;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_sessions")
public class ChatSession {
    @Id
    private String sessionId;

    @Column(nullable = false)
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String firstMessage;

    private String chatName;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime lastMessageAt;

    @Column(columnDefinition = "JSON")
    private String messages;

    @Column(nullable = false)
    private Boolean isDeleted = false;

    @Column(length = 20)
    private String questionTargetType;  // 'book' 或 'knowledge'

    @Column(length = 50)
    private String questionTargetId;    // 图书ID或知识库ID

    @Column(length = 255)
    private String questionTargetName;  // 图书名称或知识库名称

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastMessageAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastMessageAt = LocalDateTime.now();
    }
}
