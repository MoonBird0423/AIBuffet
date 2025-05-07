package com.aibuffet.service.processing.stages;

import com.aibuffet.model.DocFile;
import com.aibuffet.service.TextProcessingService;
import com.aibuffet.service.processing.ProcessContext;
import com.aibuffet.service.processing.ProcessingException;
import com.aibuffet.service.processing.ProcessingStage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TextExtractionStage implements ProcessingStage {
    
    @Autowired
    private TextProcessingService textProcessingService;

    @Override
    public void process(ProcessContext context) throws ProcessingException {
        try {
            DocFile docFile = context.getDocFile();
            log.info("开始文本提取: docId={}, fileName={}", docFile.getId(), docFile.getFileName());
            
            // 更新文档状态
            docFile.setProcessingStatus(DocFile.ProcessingStatus.CHUNKING);
            
            // 提取文本
            String extractedText = textProcessingService.extractText(docFile.getFileUrl());
            context.setExtractedText(extractedText);
            
            log.info("文本提取完成: docId={}, textLength={}", docFile.getId(), extractedText.length());
            
        } catch (Exception e) {
            String errorMessage = "文本提取失败: " + e.getMessage();
            log.error(errorMessage, e);
            throw new ProcessingException(errorMessage, e)
                    .withStage(this)
                    .withContext(context);
        }
    }
}
