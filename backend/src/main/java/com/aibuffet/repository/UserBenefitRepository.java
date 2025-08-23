package com.aibuffet.repository;

import com.aibuffet.model.UserBenefit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserBenefitRepository extends JpaRepository<UserBenefit, Long> {
    
    /**
     * 根据用户ID查询用户权益
     */
    List<UserBenefit> findByUserId(Long userId);
    
    /**
     * 根据用户ID和权益ID查询用户权益
     */
    List<UserBenefit> findByUserIdAndBenefitId(Long userId, Long benefitId);
    
    /**
     * 根据用户ID、权益ID和来源类型查询用户权益
     */
    Optional<UserBenefit> findByUserIdAndBenefitIdAndSourceType(Long userId, Long benefitId, Integer sourceType);
    
    /**
     * 根据权益ID查询所有用户权益
     */
    List<UserBenefit> findByBenefitId(Long benefitId);
    
    /**
     * 根据来源类型查询用户权益
     */
    List<UserBenefit> findBySourceType(Integer sourceType);
    
    /**
     * 查询用户在指定权益下的有效赠送权益总量
     */
    @Query("SELECT COALESCE(SUM(ub.amount), 0) FROM UserBenefit ub WHERE ub.userId = :userId AND ub.benefitId = :benefitId AND ub.sourceType = 0 AND ub.startTime <= :now AND ub.endTime >= :now")
    int sumValidGiftBenefitsByUserAndBenefit(@Param("userId") Long userId, @Param("benefitId") Long benefitId, @Param("now") LocalDateTime now);
}
