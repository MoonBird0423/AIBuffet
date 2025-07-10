package com.aibuffet.service;

import com.aibuffet.common.ApiResponse;

public interface MemberBenefitService {
    // 检查用户是否有某项权益
    boolean checkBenefit(Long userId, String benefitIdentifier);

    // 使用权益
    ApiResponse useBenefit(Long userId, String benefitIdentifier, int amount);

    // 分配角色权益
    void assignRoleBenefits(Long userId, Long roleId);

    // 移除角色权益
    void removeRoleBenefits(Long userId, Long roleId);
}
