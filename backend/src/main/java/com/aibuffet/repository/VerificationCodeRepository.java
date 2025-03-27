package com.aibuffet.repository;

import com.aibuffet.model.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    @Query("SELECT v FROM VerificationCode v WHERE v.phone = ?1 AND v.code = ?2 AND v.status = 0 AND v.expiredAt > ?3")
    Optional<VerificationCode> findValidCode(String phone, String code, LocalDateTime now);

    @Query("SELECT COUNT(v) FROM VerificationCode v WHERE v.phone = ?1 AND v.createdAt > ?2")
    long countRecentCodes(String phone, LocalDateTime sinceTime);
}