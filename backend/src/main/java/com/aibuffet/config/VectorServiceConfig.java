package com.aibuffet.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VectorServiceConfig {
    @Value("${vector.embedding.dimensions:1024}")
    private int embeddingDimensions;

    @Value("${vector.batch.size:10}")
    private int maxBatchSize;

    @Value("${vector.retry.maxAttempts:3}")
    private int maxRetryAttempts;

    @Value("${vector.retry.delay:1000}")
    private long retryDelay;

    @Value("${milvus.collection.name:doc_chunks}")
    private String milvusCollection;

    @Value("${milvus.host:localhost}")
    private String milvusHost;

    @Value("${milvus.port:19530}")
    private int milvusPort;

    // Getters
    public int getEmbeddingDimensions() {
        return embeddingDimensions;
    }

    public int getMaxBatchSize() {
        return maxBatchSize;
    }

    public int getMaxRetryAttempts() {
        return maxRetryAttempts;
    }

    public long getRetryDelay() {
        return retryDelay;
    }

    public String getMilvusCollection() {
        return milvusCollection;
    }

    public String getMilvusHost() {
        return milvusHost;
    }

    public int getMilvusPort() {
        return milvusPort;
    }
}
