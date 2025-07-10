package com.aibuffet.common;

public class BenefitException extends RuntimeException {
    private final ErrorCode errorCode;

    public BenefitException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
} 