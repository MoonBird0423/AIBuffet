package com.aibuffet.service.processing;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Builder
@Getter
@Setter
public class ProcessingTask {
    private Long docId;
    private TaskType type;
    private ProcessContext context;
    private ProcessingStage processor;
    private int retryCount;

    public enum TaskType {
        TEXT_EXTRACTION,
        CHUNKING,
        VECTORIZATION
    }
}
