package com.aibuffet.service.processing;

import lombok.Getter;

/**
 * 文档处理异常类
 */
@Getter
public class ProcessingException extends RuntimeException {
    private final ProcessingStage stage;
    private final ProcessContext context;

    public ProcessingException(String message) {
        super(message);
        this.stage = null;
        this.context = null;
    }

    public ProcessingException(String message, Throwable cause) {
        super(message, cause);
        this.stage = null;
        this.context = null;
    }

    public ProcessingException(String message, ProcessingStage stage, ProcessContext context) {
        super(message);
        this.stage = stage;
        this.context = context;
    }

    public ProcessingException(String message, Throwable cause, ProcessingStage stage, ProcessContext context) {
        super(message, cause);
        this.stage = stage;
        this.context = context;
    }

    public ProcessingException withStage(ProcessingStage stage) {
        return new ProcessingException(getMessage(), getCause(), stage, this.context);
    }

    public ProcessingException withContext(ProcessContext context) {
        return new ProcessingException(getMessage(), getCause(), this.stage, context);
    }
}
