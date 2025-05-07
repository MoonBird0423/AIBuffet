package com.aibuffet.service;

import com.aibuffet.model.DocChunk;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface VectorService {
    /**
     * 生成单个文本的向量
     */
    float[] generateVector(String text, int dimensions);

    /**
     * 批量生成向量
     */
    List<float[]> generateVectors(List<String> texts, int dimensions);

    /**
     * 存储单个向量
     */
    String storeVector(float[] vector, Map<String, Object> metadata);

    /**
     * 批量存储向量
     */
    List<String> storeVectors(List<float[]> vectors, List<Map<String, Object>> metadata);

    /**
     * 处理单个文档分块的向量化
     */
    String processChunk(DocChunk chunk, float[] vector);

    /**
     * 更新文档分块状态
     */
    void updateChunkStatus(Long chunkId, String status, String error);

    /**
     * 重试失败的分块
     */
    CompletableFuture<Void> retryFailedChunks(Long fileId);

    /**
     * 获取向量化处理状态
     */
    Map<String, Object> getProcessingStatus(Long fileId);
}
