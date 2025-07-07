package com.aibuffet.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "verification_code")
public class VerificationCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false, length = 4)
    private String code;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(columnDefinition = "TINYINT DEFAULT 0")
    private Integer status; // 0:未使用 1:已使用

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        expiredAt = createdAt.plusMinutes(5); // 默认5分钟有效期，可通过服务层设置
        status = 0;
    }

    // 验证码是否有效
    @Transient
    public boolean isValid() {
        return status == 0 && 
               LocalDateTime.now().isBefore(expiredAt);
    }
}