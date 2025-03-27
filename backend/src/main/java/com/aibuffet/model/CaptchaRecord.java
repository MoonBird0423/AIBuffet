package com.aibuffet.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "captcha_record")
public class CaptchaRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "captcha_id", nullable = false)
    private String captchaId;

    @Column(name = "captcha_code", nullable = false)
    private String captchaCode;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(columnDefinition = "TINYINT DEFAULT 0")
    private Integer status; // 0:未使用 1:已使用

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        expiredAt = createdAt.plusMinutes(5); // 延长到5分钟有效期
        status = 0;
    }

    // 验证码是否有效
    @Transient
    public boolean isValid() {
        return status == 0 && 
               LocalDateTime.now().isBefore(expiredAt);
    }
}