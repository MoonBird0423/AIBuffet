package com.aibuffet.service.impl;

import com.aibuffet.model.Benefit;
import com.aibuffet.model.BenefitUsage;
import com.aibuffet.model.RoleBenefit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Propagation;
import com.aibuffet.model.User;
import com.aibuffet.repository.BenefitRepository;
import com.aibuffet.repository.BenefitUsageRepository;
import com.aibuffet.repository.RoleBenefitRepository;
import com.aibuffet.repository.RoleRepository;
import com.aibuffet.repository.UserRepository;
import com.aibuffet.common.ApiResponse;
import com.aibuffet.service.MemberBenefitService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MemberBenefitServiceImpl implements MemberBenefitService {
    private static final Logger logger = LoggerFactory.getLogger(MemberBenefitServiceImpl.class);

    private final BenefitRepository benefitRepository;
    private final RoleRepository roleRepository;
    private final RoleBenefitRepository roleBenefitRepository;
    private final BenefitUsageRepository benefitUsageRepository;
    private final UserRepository userRepository;

    public MemberBenefitServiceImpl(
            BenefitRepository benefitRepository,
            RoleRepository roleRepository,
            RoleBenefitRepository roleBenefitRepository,
            BenefitUsageRepository benefitUsageRepository,
            UserRepository userRepository
    ) {
        this.benefitRepository = benefitRepository;
        this.roleRepository = roleRepository;
        this.roleBenefitRepository = roleBenefitRepository;
        this.benefitUsageRepository = benefitUsageRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkBenefit(Long userId, String benefitIdentifier) {
        // 1. 查询权益
        Benefit benefit = benefitRepository.findByIdentifier(benefitIdentifier);
        if (benefit == null) return false;

        // 2. 查询用户角色及角色权益
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getRoleId() != null) {
            List<RoleBenefit> roleBenefits = roleBenefitRepository.findByRoleIdAndBenefitId(user.getRoleId(), benefit.getId());
            for (RoleBenefit rb : roleBenefits) {
                // 计算已使用量
                int used = benefitUsageRepository.sumByUserAndRoleAndBenefit(userId, user.getRoleId(), benefit.getId());
                int remaining = rb.getQuota() - used;
                
                if (rb.getQuota() == -1 || (rb.getQuota() > 0 && remaining > 0)) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    @Transactional
    public void assignRoleBenefits(Long userId, Long roleId) {
        // TODO: 实现角色权益分配逻辑
    }

    @Override
    @Transactional
    public void removeRoleBenefits(Long userId, Long roleId) {
        // TODO: 实现角色权益移除逻辑
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void recordBenefitUsage(Long userId, String identifier, int amount, Long roleId) {
        Benefit benefit = benefitRepository.findByIdentifier(identifier);
        if (benefit == null) {
            throw new IllegalArgumentException("无效的权益标识: " + identifier);
        }

        BenefitUsage usage = new BenefitUsage();
        usage.setUserId(userId);
        usage.setBenefitId(benefit.getId());
        usage.setAmount(amount);
        usage.setRoleId(roleId);
        benefitUsageRepository.save(usage);
        
        logger.info("记录权益消耗: 用户[{}] 权益[{}] 数量[{}]", userId, identifier, amount);
    }
}
