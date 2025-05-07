package com.aibuffet.service.processing.stages;

import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import com.aibuffet.model.VectorStatus;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.service.VectorService;
import com.aibuffet.service.processing.ProcessContext;
import com.aibuffet.service.processing.ProcessingException;
import com.aibuffet.service.processing.ProcessingStage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class VectorizationStage implements ProcessingStage {
    
    private static final int BATCH_SIZE = 5;  // 减小批处理大小，降低单批次处理的数据量
    
    @Autowired
    private VectorService vectorService;
    
    @Autowired
    private DocChunkRepository docChunkRepository;
    
    @Autowired
    private DocFileRepository docFileRepository;

    @Override
    @Transactional
    public void process(ProcessContext context) throws ProcessingException {
        try {
            DocFile docFile = context.getDocFile();
            List<DocChunk> chunks = context.getChunks();
            
            // 更新文档状态并保存
            docFile.setProcessingStatus(DocFile.ProcessingStatus.VECTORIZING);
            docFileRepository.save(docFile);
            log.info("开始向量化处理: docId={}, chunkCount={}", docFile.getId(), chunks.size());
            AtomicInteger processedCount = new AtomicInteger(0);
            
            // 按批次处理
            List<List<DocChunk>> batches = splitIntoBatches(chunks, BATCH_SIZE);
            for (List<DocChunk> batch : batches) {
                processBatch(batch, docFile.getId());
                processedCount.addAndGet(batch.size());
                log.info("批次处理完成: docId={}, progress={}/{}", 
                    docFile.getId(), processedCount.get(), chunks.size());
            }
            
            // 检查是否所有分块都处理成功
            boolean allSuccess = chunks.stream()
                .allMatch(chunk -> VectorStatus.COMPLETED.equals(chunk.getVectorStatus()));
            
            // 更新文档状态
            DocFile.ProcessingStatus finalStatus = allSuccess ? 
                DocFile.ProcessingStatus.COMPLETED : DocFile.ProcessingStatus.FAILED;
            
            docFile.setProcessingStatus(finalStatus);
            if (!allSuccess) {
                docFile.setErrorMessage("部分分块向量化失败");
                docFileRepository.save(docFile);  // 保存失败状态
                throw new ProcessingException("部分分块向量化失败")
                    .withStage(this)
                    .withContext(context);
            }
            
            docFileRepository.save(docFile);  // 保存完成状态
            log.info("向量化处理完成: docId={}, status={}", docFile.getId(), finalStatus);
            
        } catch (Exception e) {
            String errorMessage = "向量化处理失败: " + e.getMessage();
            log.error(errorMessage, e);
            throw new ProcessingException(errorMessage, e)
                    .withStage(this)
                    .withContext(context);
        }
    }
    
    private List<List<DocChunk>> splitIntoBatches(List<DocChunk> chunks, int batchSize) {
        List<List<DocChunk>> batches = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i += batchSize) {
            batches.add(chunks.subList(i, Math.min(chunks.size(), i + batchSize)));
        }
        return batches;
    }
    
    @Transactional
    protected void processBatch(List<DocChunk> batch, Long docId) {
        try {
            // 准备批量向量生成
            List<String> texts = batch.stream()
                .map(DocChunk::getContent)
                .toList();
            
            // 生成向量
            List<float[]> vectors = vectorService.generateVectors(texts, 1024);
            
            // 准备元数据
            List<Map<String, Object>> metadata = batch.stream()
                .map(chunk -> {
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("fileId", docId);
                    meta.put("chunkIndex", chunk.getChunkIndex());
                    
                    // 控制content长度在4000字符以内，避免metadata超出限制
                    String content = chunk.getContent();
                    if (content.length() > 4000) {
                        content = content.substring(0, 3997) + "...";
                    }
                    meta.put("content", content);
                    return meta;
                })
                .toList();
            
            // 存储向量
            List<String> vectorIds = vectorService.storeVectors(vectors, metadata);
            
            // 更新分块状态
            for (int i = 0; i < batch.size(); i++) {
                DocChunk chunk = batch.get(i);
                chunk.setVectorId(vectorIds.get(i));
                chunk.setVectorStatus(VectorStatus.COMPLETED);
            }
            
            docChunkRepository.saveAll(batch);
            
        } catch (Exception e) {
            // 更新失败状态
            batch.forEach(chunk -> {
                chunk.setVectorStatus(VectorStatus.FAILED);
                chunk.setVectorError(e.getMessage());
            });
            docChunkRepository.saveAll(batch);
            throw e;
        }
    }
}
