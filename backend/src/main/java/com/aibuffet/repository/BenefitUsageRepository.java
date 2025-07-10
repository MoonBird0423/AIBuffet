package com.aibuffet.repository;

import com.aibuffet.model.BenefitUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BenefitUsageRepository extends JpaRepository<BenefitUsage, Long> {
    List<BenefitUsage> findByUserId(Long userId);
    List<BenefitUsage> findByBenefitId(Long benefitId);
    
    @Query("SELECT COALESCE(SUM(bu.amount), 0) FROM BenefitUsage bu WHERE bu.userId = :userId AND bu.roleId = :roleId AND bu.benefitId = :benefitId")
    int sumByUserAndRoleAndBenefit(@Param("userId") Long userId, @Param("roleId") Long roleId, @Param("benefitId") Long benefitId);
}
