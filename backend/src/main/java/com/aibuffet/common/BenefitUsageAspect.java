package com.aibuffet.common;

import com.aibuffet.model.User;
import com.aibuffet.service.MemberBenefitService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Component
public class BenefitUsageAspect {
    private static final Logger logger = LoggerFactory.getLogger(BenefitUsageAspect.class);

    private final MemberBenefitService memberBenefitService;

    public BenefitUsageAspect(MemberBenefitService memberBenefitService) {
        this.memberBenefitService = memberBenefitService;
    }

    @AfterReturning("@annotation(com.aibuffet.common.BenefitUsage)")
    public void afterBenefitUsage(JoinPoint joinPoint) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            BenefitUsage annotation = method.getAnnotation(BenefitUsage.class);
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User) {
                User user = (User) auth.getPrincipal();
                memberBenefitService.recordBenefitUsage(
                    user.getId(),
                    annotation.identifier(),
                    annotation.amount(),
                    user.getRoleId()
                );
                logger.debug("成功记录权益消耗: {} - {}", annotation.identifier(), annotation.amount());
            }
        } catch (Exception e) {
            logger.error("记录权益消耗失败", e);
        }
    }
}
