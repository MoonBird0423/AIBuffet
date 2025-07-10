package com.aibuffet.service;

import com.aibuffet.common.ApiResponse;

public interface MemberBenefitService {
    // 检查用户是否有某项权益
    boolean checkBenefit(Long userId, String benefitIdentifier);

    // 分配角色权益
    void assignRoleBenefits(Long userId, Long roleId);

    // 移除角色权益
    void removeRoleBenefits(Long userId, Long roleId);

    // 记录权益消耗
    void recordBenefitUsage(Long userId, String identifier, int amount, Long roleId);
}
