package com.aibuffet.repository;

import com.aibuffet.model.CaptchaRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.Optional;

public interface CaptchaRecordRepository extends JpaRepository<CaptchaRecord, Long> {
    @Query("SELECT c FROM CaptchaRecord c WHERE c.captchaId = ?1 AND LOWER(c.captchaCode) = LOWER(?2) AND c.status = 0 AND c.expiredAt > ?3")
    Optional<CaptchaRecord> findValidCaptcha(String captchaId, String captchaCode, LocalDateTime now);

    @Query("SELECT COUNT(c) FROM CaptchaRecord c WHERE c.ipAddress = ?1 AND c.createdAt > ?2")
    long countRecentCaptchas(String ipAddress, LocalDateTime sinceTime);

    Optional<CaptchaRecord> findByCaptchaId(String captchaId);
}