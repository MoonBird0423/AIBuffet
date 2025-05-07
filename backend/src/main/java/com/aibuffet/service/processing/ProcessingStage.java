package com.aibuffet.service.processing;

import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;

/**
 * 文档处理阶段接口
 */
public interface ProcessingStage {
    
    /**
     * 处理当前阶段的任务
     *
     * @param context 处理上下文
     * @throws ProcessingException 处理过程中的异常
     */
    @Retryable(
        value = {ProcessingException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000)
    )
    void process(ProcessContext context) throws ProcessingException;
}
