package com.aibuffet.service.processing.stages;

import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import com.aibuffet.model.TextChunk;
import com.aibuffet.repository.DocChunkRepository;
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

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class ChunkingStage implements ProcessingStage {
    
    @Autowired
    private TextProcessingService textProcessingService;
    
    @Autowired
    private DocChunkRepository docChunkRepository;
    
    @Autowired
    private DocFileRepository docFileRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void process(ProcessContext context) throws ProcessingException {
        try {
            DocFile docFile = context.getDocFile();
            log.info("开始文本分块: docId={}, fileName={}", docFile.getId(), docFile.getFileName());
            
            // 获取要处理的文本
            String text = context.getExtractedText();
            if (text == null) {
                // 尝试从数据库重新获取
                docFile = docFileRepository.findById(docFile.getId()).orElseThrow(() -> 
                    new ProcessingException("找不到文档记录"));
                text = docFile.getExtractedText();
                
                if (text == null) {
                    throw new ProcessingException("文档缺少提取文本");
                }
                // 更新上下文
                context.setExtractedText(text);
            }
            
            // 检查已有的分块
            List<DocChunk> existingChunks = docChunkRepository.findByFileIdOrderByChunkIndexAsc(docFile.getId());
            if (!existingChunks.isEmpty()) {
                log.info("发现已有分块，跳过处理: docId={}, chunkCount={}", docFile.getId(), existingChunks.size());
                context.setChunks(existingChunks);
                return;
            }
            
            // 更新文档状态
            docFile.setProcessingStatus(DocFile.ProcessingStatus.CHUNKING);
            docFileRepository.save(docFile);
            
            // 分块处理
            log.debug("开始创建文本分块: textLength={}", text.length());
            List<TextChunk> textChunks = textProcessingService.createChunks(text);
            log.debug("文本分块创建完成: chunkCount={}", textChunks.size());
            
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
            
            // 保存成功后更新状态
            docFile.setProcessingStatus(DocFile.ProcessingStatus.VECTORIZING);
            docFileRepository.save(docFile);
            
            log.info("文本分块完成: docId={}, chunkCount={}", docFile.getId(), docChunks.size());
            
        } catch (Exception e) {
            String errorMessage = "文本分块失败: " + e.getMessage();
            log.error(errorMessage, e);
            
            // 更新失败状态
            DocFile docFile = context.getDocFile();
            docFile.setProcessingStatus(DocFile.ProcessingStatus.FAILED);
            docFile.setErrorMessage(errorMessage);
            docFileRepository.save(docFile);
            
            throw new ProcessingException(errorMessage, e)
                    .withStage(this)
                    .withContext(context);
        }
    }
}
