package com.aibuffet.service.processing.stages;

import com.aibuffet.model.DocFile;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.service.TextProcessingService;
import com.aibuffet.service.processing.ProcessContext;
import com.aibuffet.service.processing.ProcessingException;
import com.aibuffet.service.processing.ProcessingStage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Slf4j
@Component
public class TextExtractionStage implements ProcessingStage {
    
    @Autowired
    private TextProcessingService textProcessingService;
    
    @Autowired
    private DocFileRepository docFileRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void process(ProcessContext context) throws ProcessingException {
        try {
            DocFile docFile = context.getDocFile();
            log.info("开始文本提取: docId={}, fileName={}", docFile.getId(), docFile.getFileName());
            
            // 如果已经提取过文本，直接返回
            if (docFile.getExtractedText() != null) {
                log.info("文件已存在提取文本，跳过处理: docId={}, textLength={}", 
                    docFile.getId(), docFile.getExtractedText().length());
                context.setExtractedText(docFile.getExtractedText());
                return;
            }
            
            // 更新文档状态为文本提取中
            docFileRepository.updateProcessingStatus(docFile.getId(), DocFile.ProcessingStatus.EXTRACTING_TEXT);
            
            // 提取文本
            String extractedText = textProcessingService.extractText(docFile.getFileUrl());
            
            // 使用原生SQL更新以确保数据被正确保存
            int updated = entityManager.createNativeQuery(
                "UPDATE doc_files SET extracted_text = :text WHERE id = :id")
                .setParameter("text", extractedText)
                .setParameter("id", docFile.getId())
                .executeUpdate();
                
            log.debug("SQL更新影响行数: {}", updated);
            
            // 清除持久化上下文并重新获取实体
            entityManager.clear();
            docFile = docFileRepository.findById(docFile.getId()).orElse(null);
            if (docFile != null && docFile.getExtractedText() != null) {
                log.info("文本提取和保存完成: docId={}, textLength={}", 
                    docFile.getId(), docFile.getExtractedText().length());
                context.setExtractedText(docFile.getExtractedText());
            } else {
                throw new ProcessingException("文本保存验证失败");
            }
            
        } catch (Exception e) {
            handleExtractionError(context, e);
        }
    }
    
    private void handleExtractionError(ProcessContext context, Exception e) {
        String errorMessage = "文本提取失败: " + e.getMessage();
        log.error(errorMessage, e);
        
        DocFile docFile = context.getDocFile();
        docFileRepository.updateProcessingStatusAndError(docFile.getId(), DocFile.ProcessingStatus.FAILED, errorMessage);
        
        throw new ProcessingException(errorMessage, e)
            .withStage(this)
            .withContext(context);
    }
}
