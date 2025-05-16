package com.aibuffet.service.processing;

import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Getter
public class ProcessContext {
    private static final Logger logger = LoggerFactory.getLogger(ProcessContext.class);
    private final DocFile docFile;
    private String extractedText;
    private List<DocChunk> chunks;
    private Map<String, Object> metadata;
    private boolean success;
    private String errorMessage;

    public ProcessContext(DocFile docFile) {
        this.docFile = docFile;
        this.success = true;
        // 如果DocFile已经有提取的文本，直接使用
        if (docFile != null && docFile.getExtractedText() != null) {
            this.extractedText = docFile.getExtractedText();
            logger.debug("从DocFile初始化提取文本: length={}", extractedText.length());
        }
    }

    public String getExtractedText() {
        if (extractedText == null && docFile != null && docFile.getExtractedText() != null) {
            logger.debug("从DocFile获取提取文本: length={}", docFile.getExtractedText().length());
            return docFile.getExtractedText();
        }
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        if (extractedText != null) {
            logger.debug("设置提取文本: length={}", extractedText.length());
            this.extractedText = extractedText;
            // 同步更新DocFile
            if (docFile != null) {
                docFile.setExtractedText(extractedText);
            }
        } else {
            logger.warn("尝试设置null文本");
        }
    }

    public List<DocChunk> getChunks() {
        return chunks;
    }

    public void setChunks(List<DocChunk> chunks) {
        if (chunks != null) {
            logger.debug("设置文本分块: count={}", chunks.size());
            this.chunks = chunks;
        } else {
            logger.warn("尝试设置null分块");
        }
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public void setError(String message) {
        this.success = false;
        this.errorMessage = message;
        logger.error("处理上下文设置错误: {}", message);
    }

    public boolean isSuccessful() {
        return success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}
