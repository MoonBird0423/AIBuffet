package com.aibuffet.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BenefitException.class)
    public ApiResponse<?> handleBenefitException(BenefitException ex) {
        logger.info("捕获BenefitException: code={}, message={}", ex.getErrorCode(), ex.getMessage());
        return ApiResponse.error(ex.getErrorCode(), ex.getMessage());
    }
    // 可扩展其他异常处理
} 