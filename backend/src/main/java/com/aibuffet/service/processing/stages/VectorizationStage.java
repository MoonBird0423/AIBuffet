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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.util.*;

@Slf4j
@Component
public class VectorizationStage implements ProcessingStage {
    
    private static final int BATCH_SIZE = 3;  // 减小批处理大小，降低单批次处理的数据量
    private static final int MAX_RETRY_COUNT = 5;  // 增加最大重试次数
    private static final long RETRY_DELAY_MS = 2000; // 重试延迟时间
    private static final long BATCH_PAUSE_MS = 100; // 批次间暂停时间
    
    @Autowired
    private VectorService vectorService;
    
    @Autowired
    private DocChunkRepository docChunkRepository;
    
    @Autowired
    private DocFileRepository docFileRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED, timeout = 180)
    public void process(ProcessContext context) throws ProcessingException {
        try {
            DocFile docFile = context.getDocFile();
            List<DocChunk> chunks = context.getChunks();
            
            // 验证输入
            if (chunks == null || chunks.isEmpty()) {
                // 尝试从数据库获取分块
                chunks = docChunkRepository.findByFileIdOrderByChunkIndexAsc(docFile.getId());
                if (chunks.isEmpty()) {
                    throw new ProcessingException("没有找到需要处理的文本分块");
                }
                context.setChunks(chunks);
            }
            
            // 检查是否已经完成向量化
            boolean allCompleted = chunks.stream()
                .allMatch(chunk -> VectorStatus.COMPLETED.equals(chunk.getVectorStatus()));
            if (allCompleted) {
                log.info("文档分块已全部完成向量化，跳过处理: docId={}", docFile.getId());
                docFile.setProcessingStatus(DocFile.ProcessingStatus.COMPLETED);
                docFileRepository.save(docFile);
                return;
            }
            
            // 更新文档状态并保存
            docFile.setProcessingStatus(DocFile.ProcessingStatus.VECTORIZING);
            docFileRepository.save(docFile);
            log.info("开始向量化处理: docId={}, chunkCount={}", docFile.getId(), chunks.size());
            
            // 按批次处理
            List<List<DocChunk>> batches = splitIntoBatches(chunks, BATCH_SIZE);
            int failedBatches = 0;
            int completedBatches = 0;
            int totalBatches = batches.size();
            
            for (List<DocChunk> batch : batches) {
                double progress = (completedBatches * 100.0) / totalBatches;
                log.info("向量化进度: docId={}, 完成度={:.2f}%, ({}/{})", 
                    docFile.getId(), progress, completedBatches, totalBatches);
                // 检查批次是否需要处理
                if (batch.stream().allMatch(chunk -> VectorStatus.COMPLETED.equals(chunk.getVectorStatus()))) {
                    log.debug("跳过已完成的批次: docId={}, batchSize={}", docFile.getId(), batch.size());
                    continue;
                }
                
                // 处理带重试
                boolean success = false;
                int retryCount = 0;
                while (!success && retryCount < MAX_RETRY_COUNT) {
                    try {
                        processBatch(batch, docFile.getId());
                        success = true;
                        completedBatches++;
                        
                        // 批次间暂停，让出资源
                        Thread.sleep(BATCH_PAUSE_MS);
                        System.gc(); // 建议进行垃圾回收
                    } catch (Exception e) {
                        retryCount++;
                        if (retryCount >= MAX_RETRY_COUNT) {
                            log.error("批次处理失败，达到最大重试次数: docId={}, batchSize={}, retryCount={}", 
                                docFile.getId(), batch.size(), retryCount);
                            failedBatches++;
                            break;
                        }
                        log.warn("批次处理失败，准备重试: docId={}, batchSize={}, retryCount={}, error={}", 
                            docFile.getId(), batch.size(), retryCount, e.getMessage());
                        Thread.sleep(1000 * retryCount); // 增加重试间隔
                    }
                }
            }
            
            // 检查最终处理结果
            List<DocChunk> finalChunks = docChunkRepository.findByFileIdOrderByChunkIndexAsc(docFile.getId());
            boolean allSuccess = finalChunks.stream()
                .allMatch(chunk -> VectorStatus.COMPLETED.equals(chunk.getVectorStatus()));
            
            // 更新文档状态
            DocFile.ProcessingStatus finalStatus = allSuccess ? 
                DocFile.ProcessingStatus.COMPLETED : DocFile.ProcessingStatus.FAILED;
            
            docFile.setProcessingStatus(finalStatus);
            if (!allSuccess) {
                String errorMessage = String.format("向量化处理部分失败: 总批次=%d, 失败批次=%d", 
                    batches.size(), failedBatches);
                docFile.setErrorMessage(errorMessage);
                docFileRepository.save(docFile);
                throw new ProcessingException(errorMessage)
                    .withStage(this)
                    .withContext(context);
            }
            
            docFileRepository.save(docFile);
            log.info("向量化处理完成: docId={}, status={}", docFile.getId(), finalStatus);
            
        } catch (Exception e) {
            String errorMessage = "向量化处理失败: " + e.getMessage();
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
    
    private List<List<DocChunk>> splitIntoBatches(List<DocChunk> chunks, int batchSize) {
        List<List<DocChunk>> batches = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i += batchSize) {
            batches.add(new ArrayList<>(chunks.subList(i, Math.min(chunks.size(), i + batchSize))));
        }
        return batches;
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW,
                  isolation = Isolation.READ_COMMITTED,
                  timeout = 180)
    protected void processBatch(List<DocChunk> batch, Long docId) {
        try {
            log.info("开始处理批次: docId={}, batchSize={}, 内存使用: {}MB", 
                docId, batch.size(), Runtime.getRuntime().totalMemory() / (1024 * 1024));
            
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
                    meta.put("chunkId", chunk.getId());
                    meta.put("fileId", docId);
                    meta.put("chunkIndex", chunk.getChunkIndex());
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
                chunk.setVectorError(null); // 清除之前的错误信息
            }
            
            docChunkRepository.saveAll(batch);
            log.debug("批次处理完成: docId={}, batchSize={}", docId, batch.size());
            
        } catch (Exception e) {
            log.error("批次处理失败: docId={}, batchSize={}, error={}", docId, batch.size(), e.getMessage());
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
