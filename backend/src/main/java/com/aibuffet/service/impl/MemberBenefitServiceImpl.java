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
        logger.debug("开始检查用户权益 - 用户ID: {}, 权益标识: {}", userId, benefitIdentifier);
        
        // 查询用户
        User user = userRepository.findById(userId).orElse(null);
        logger.debug("用户查询结果 - 用户ID: {}, 存在: {}, 角色ID: {}", 
            userId, user != null, user != null ? user.getRoleId() : null);
        
        if (user == null || user.getRoleId() == null) {
            logger.debug("权益检查失败 - 用户ID: {}, 原因: 用户不存在或角色ID为空", userId);
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // 检查角色是否过期
        boolean isExpired = user.getExpireTime() != null && now.isAfter(user.getExpireTime());
        logger.debug("角色过期检查 - 用户ID: {}, 过期时间: {}, 当前时间: {}, 是否过期: {}", 
            userId, user.getExpireTime(), now, isExpired);
        
        if (isExpired) {
            logger.debug("权益检查失败 - 用户ID: {}, 原因: 角色已过期", userId);
            return false;
        }

        // 查询权益
        Benefit benefit = benefitRepository.findByIdentifier(benefitIdentifier);
        logger.debug("权益查询结果 - 权益标识: {}, 存在: {}, 权益ID: {}", 
            benefitIdentifier, benefit != null, benefit != null ? benefit.getId() : null);
        
        if (benefit == null) {
            logger.debug("权益检查失败 - 用户ID: {}, 原因: 权益不存在, 权益标识: {}", userId, benefitIdentifier);
            return false;
        }

        // 查询角色权益
        List<RoleBenefit> roleBenefits = roleBenefitRepository.findByRoleIdAndBenefitId(user.getRoleId(), benefit.getId());
        logger.debug("角色权益查询结果 - 用户ID: {}, 角色ID: {}, 权益ID: {}, 角色权益数量: {}", 
            userId, user.getRoleId(), benefit.getId(), roleBenefits.size());
        
        int year = now.getYear();
        int month = now.getMonthValue();
        
        // 查询本月已使用的权益
        int usedAmount = benefitUsageRepository.sumByUserAndRoleAndBenefitThisMonth(userId, user.getRoleId(), benefit.getId(), year, month);
        logger.debug("本月已使用权益查询 - 用户ID: {}, 年份: {}, 月份: {}, 已使用数量: {}", 
            userId, year, month, usedAmount);
        
        // 查询当前有效的赠送权益
        int giftBenefitAmount = userBenefitRepository.sumValidGiftBenefitsByUserAndBenefit(userId, benefit.getId(), now);
        logger.debug("当前有效赠送权益查询 - 用户ID: {}, 权益ID: {}, 赠送权益数量: {}", 
            userId, benefit.getId(), giftBenefitAmount);
        
        // 计算总可用权益并判断
        for (RoleBenefit rb : roleBenefits) {
            int roleBenefitQuota = (rb.getQuota() == -1) ? Integer.MAX_VALUE : rb.getQuota();
            int totalAvailable = roleBenefitQuota + giftBenefitAmount;
            
            logger.debug("权益计算详情 - 用户ID: {}, 角色权益配额: {}, 赠送权益: {}, 总可用: {}, 已使用: {}, 剩余: {}", 
                userId, rb.getQuota(), giftBenefitAmount, totalAvailable, usedAmount, totalAvailable - usedAmount);
            
            // 如果角色权益是无限制(-1)，直接返回true
            if (rb.getQuota() == -1) {
                logger.debug("权益检查成功 - 用户ID: {}, 原因: 角色权益无限制", userId);
                return true;
            }
            
            // 检查总可用权益是否大于已使用权益
            if (usedAmount < totalAvailable) {
                logger.debug("权益检查成功 - 用户ID: {}, 原因: 总可用权益({})大于已使用权益({})", 
                    userId, totalAvailable, usedAmount);
                return true;
            }
        }
        
        // 如果没有角色权益，但有赠送权益，也需要检查
        if (roleBenefits.isEmpty() && giftBenefitAmount > usedAmount) {
            logger.debug("权益检查成功 - 用户ID: {}, 原因: 无角色权益但赠送权益({})大于已使用权益({})", 
                userId, giftBenefitAmount, usedAmount);
            return true;
        }
        
        logger.debug("权益检查失败 - 用户ID: {}, 权益标识: {}, 原因: 所有可用权益均已用完", userId, benefitIdentifier);
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
