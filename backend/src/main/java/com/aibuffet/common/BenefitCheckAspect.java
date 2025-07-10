package com.aibuffet.common;

import com.aibuffet.service.MemberBenefitService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
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
public class BenefitCheckAspect {
    private static final Logger logger = LoggerFactory.getLogger(BenefitCheckAspect.class);

    private final MemberBenefitService memberBenefitService;
    private final HttpServletRequest request;

    public BenefitCheckAspect(MemberBenefitService memberBenefitService, HttpServletRequest request) {
        this.memberBenefitService = memberBenefitService;
        this.request = request;
    }

    @Around("@annotation(com.aibuffet.common.BenefitCheck)")
    public Object checkBenefit(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        BenefitCheck benefitCheck = method.getAnnotation(BenefitCheck.class);
        String identifier = benefitCheck.value();

        // 获取当前用户ID（假设已集成Spring Security，Principal为userId字符串）
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        logger.info("BenefitCheck - Current auth: {}, principal: {}, type: {}", authentication, authentication != null ? authentication.getPrincipal() : null, authentication != null ? authentication.getPrincipal().getClass() : null);
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof com.aibuffet.model.User) {
                userId = ((com.aibuffet.model.User) principal).getId();
                logger.debug("Extracted userId from User: {}", userId);
            } else if (principal instanceof String) {
                try {
                    userId = Long.valueOf((String) principal);
                    logger.debug("Extracted userId from String: {}", userId);
                } catch (Exception e) {
                    logger.warn("Principal string is not a valid userId: {}", principal);
                }
            } else {
                logger.warn("Unknown principal type: {}", principal.getClass());
            }
        }
        if (userId == null) {
            throw new RuntimeException("用户未登录或无法识别用户ID");
        }

        boolean hasBenefit = memberBenefitService.checkBenefit(userId, identifier);
        if (!hasBenefit) {
            logger.warn("用户[{}]无权限访问权益[{}]", userId, identifier);
            throw new BenefitException(ErrorCode.PERMISSION_DENIED, "权限未开通或已消耗完");
        }
        return joinPoint.proceed();
    }
}
