package com.aibuffet.service.processing.stages;

import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import com.aibuffet.model.TextChunk;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.service.TextProcessingService;
import com.aibuffet.service.processing.ProcessContext;
import com.aibuffet.service.processing.ProcessingException;
import com.aibuffet.service.processing.ProcessingStage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class ChunkingStage implements ProcessingStage {
    
    @Autowired
    private TextProcessingService textProcessingService;
    
    @Autowired
    private DocChunkRepository docChunkRepository;

    @Override
    @Transactional
    public void process(ProcessContext context) throws ProcessingException {
        try {
            DocFile docFile = context.getDocFile();
            log.info("开始文本分块: docId={}, fileName={}", docFile.getId(), docFile.getFileName());
            
            // 更新文档状态
            docFile.setProcessingStatus(DocFile.ProcessingStatus.CHUNKING);
            
            // 分块处理
            List<TextChunk> textChunks = textProcessingService.createChunks(context.getExtractedText());
            List<DocChunk> docChunks = new ArrayList<>();
            
            for (int i = 0; i < textChunks.size(); i++) {
                TextChunk textChunk = textChunks.get(i);
                DocChunk docChunk = new DocChunk();
                docChunk.setFileId(docFile.getId());
                docChunk.setContent(textChunk.getContent());
                docChunk.setChunkIndex(i);
                docChunk.setTokenCount(textChunk.getTokenCount());
                docChunk.setMetadataMap(textChunk.getMetadata());
                docChunks.add(docChunk);
            }
            
            // 批量保存分块
            docChunks = docChunkRepository.saveAll(docChunks);
            context.setChunks(docChunks);
            
            log.info("文本分块完成: docId={}, chunkCount={}", docFile.getId(), docChunks.size());
            
        } catch (Exception e) {
            String errorMessage = "文本分块失败: " + e.getMessage();
            log.error(errorMessage, e);
            throw new ProcessingException(errorMessage, e)
                    .withStage(this)
                    .withContext(context);
        }
    }
}
