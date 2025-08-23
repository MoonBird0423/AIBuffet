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
import com.aibuffet.repository.UserBenefitRepository;
import com.aibuffet.common.ApiResponse;
import com.aibuffet.service.MemberBenefitService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MemberBenefitServiceImpl implements MemberBenefitService {
    private static final Logger logger = LoggerFactory.getLogger(MemberBenefitServiceImpl.class);

    private final BenefitRepository benefitRepository;
    private final RoleRepository roleRepository;
    private final RoleBenefitRepository roleBenefitRepository;
    private final BenefitUsageRepository benefitUsageRepository;
    private final UserRepository userRepository;
    private final UserBenefitRepository userBenefitRepository;

    public MemberBenefitServiceImpl(
            BenefitRepository benefitRepository,
            RoleRepository roleRepository,
            RoleBenefitRepository roleBenefitRepository,
            BenefitUsageRepository benefitUsageRepository,
            UserRepository userRepository,
            UserBenefitRepository userBenefitRepository
    ) {
        this.benefitRepository = benefitRepository;
        this.roleRepository = roleRepository;
        this.roleBenefitRepository = roleBenefitRepository;
        this.benefitUsageRepository = benefitUsageRepository;
        this.userRepository = userRepository;
        this.userBenefitRepository = userBenefitRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkBenefit(Long userId, String benefitIdentifier) {
        // 查询用户
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRoleId() == null) return false;
        
        // 检查角色是否过期
        if (user.getExpireTime() != null && LocalDateTime.now().isAfter(user.getExpireTime())) {
            return false;
        }

        // 查询权益
        Benefit benefit = benefitRepository.findByIdentifier(benefitIdentifier);
        if (benefit == null) return false;

        // 查询角色权益
        List<RoleBenefit> roleBenefits = roleBenefitRepository.findByRoleIdAndBenefitId(user.getRoleId(), benefit.getId());
        
        LocalDateTime now = LocalDateTime.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        
        // 查询本月已使用的权益
        int usedAmount = benefitUsageRepository.sumByUserAndRoleAndBenefitThisMonth(userId, user.getRoleId(), benefit.getId(), year, month);
        
        // 查询当前有效的赠送权益
        int giftBenefitAmount = userBenefitRepository.sumValidGiftBenefitsByUserAndBenefit(userId, benefit.getId(), now);
        
        // 计算总可用权益并判断
        for (RoleBenefit rb : roleBenefits) {
            int roleBenefitQuota = (rb.getQuota() == -1) ? Integer.MAX_VALUE : rb.getQuota();
            int totalAvailable = roleBenefitQuota + giftBenefitAmount;
            
            // 如果角色权益是无限制(-1)，直接返回true
            if (rb.getQuota() == -1) {
                return true;
            }
            
            // 检查总可用权益是否大于已使用权益
            if (usedAmount < totalAvailable) {
                return true;
            }
        }
        
        // 如果没有角色权益，但有赠送权益，也需要检查
        if (roleBenefits.isEmpty() && giftBenefitAmount > usedAmount) {
            return true;
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
