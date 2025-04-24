package com.aibuffet.service;

import com.aibuffet.model.DocChunk;
import com.aibuffet.model.VectorStatus;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface VectorService {
    // 单条文本向量化
    float[] generateVector(String text, int dimensions);
    
    // 批量文本向量化（最多10条）
    List<float[]> generateVectors(List<String> texts, int dimensions);
    
    // 向量存储到 Milvus
    String storeVector(float[] vector, Map<String, Object> metadata);
    
    // 批量存储向量
    List<String> storeVectors(List<float[]> vectors, List<Map<String, Object>> metadata);
    
    // 异步处理文档块
    CompletableFuture<String> processChunkAsync(DocChunk chunk);
    
    // 更新文档块状态
    void updateChunkStatus(Long chunkId, VectorStatus status, String error);
    
    // 重试失败的向量化
    CompletableFuture<Void> retryFailedChunks(Long fileId);
    
    // 获取处理进度
    Map<String, Object> getProcessingStatus(Long fileId);
}
