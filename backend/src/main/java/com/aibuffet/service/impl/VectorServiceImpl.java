package com.aibuffet.service.impl;

import com.aibuffet.config.VectorServiceConfig;
import com.aibuffet.model.DocChunk;
import com.aibuffet.model.Model;
import com.aibuffet.model.VectorStatus;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.repository.ModelRepository;
import com.aibuffet.service.VectorService;
import com.alibaba.fastjson.JSON;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import io.milvus.v2.client.MilvusClientV2;
import io.milvus.v2.common.DataType;
import io.milvus.v2.common.IndexParam;
import io.milvus.v2.service.collection.request.AddFieldReq;
import io.milvus.v2.service.collection.request.CreateCollectionReq;
import io.milvus.v2.service.collection.request.DescribeCollectionReq;
import io.milvus.v2.service.collection.request.GetLoadStateReq;
import io.milvus.v2.service.collection.request.HasCollectionReq;
import io.milvus.v2.service.vector.request.InsertReq;
import io.milvus.v2.service.vector.response.InsertResp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.time.Duration;
import jakarta.annotation.PostConstruct;

@Service
public class VectorServiceImpl implements VectorService {
    private static final Logger logger = LoggerFactory.getLogger(VectorServiceImpl.class);
    private static final String VECTOR_MODEL_PURPOSE = "向量化";
    private static final String MODEL_NAME = "text-embedding-v3";
    private static final String INDEX_NAME = "vector_index";

    private final VectorServiceConfig config;
    private final ModelRepository modelRepository;
    private final DocChunkRepository chunkRepository;
    private final WebClient.Builder webClientBuilder;
    private final MilvusClientV2 milvusClient;
    private final Gson gson;

    private Model vectorModel;
    private WebClient webClient;

    @Autowired
    public VectorServiceImpl(
            VectorServiceConfig config,
            ModelRepository modelRepository,
            DocChunkRepository chunkRepository,
            WebClient.Builder webClientBuilder,
            MilvusClientV2 milvusClient) {
        this.config = config;
        this.modelRepository = modelRepository;
        this.chunkRepository = chunkRepository;
        this.webClientBuilder = webClientBuilder;
        this.milvusClient = milvusClient;
        this.gson = new Gson();
    }

    @PostConstruct
    public void init() {
        logger.info("Initializing VectorService");
        try {
            logger.debug("Loading vector model for purpose: {}", VECTOR_MODEL_PURPOSE);
            vectorModel = modelRepository.findByPurposeExact(VECTOR_MODEL_PURPOSE)
                    .orElseThrow(() -> new RuntimeException("Vector model not found"));
            logger.debug("Found vector model: baseUrl={}", vectorModel.getBaseUrl());
            
            logger.debug("Configuring web client");
            webClient = webClientBuilder
                    .baseUrl(vectorModel.getBaseUrl())
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + vectorModel.getApiKey())
                    .build();
            logger.info("Web client configured successfully");

            logger.info("Initializing Milvus collection");
            ensureMilvusCollection();
            logger.info("VectorService initialization completed successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize VectorService", e);
            throw e;
        }
    }

    private void ensureMilvusCollection() {
        String collectionName = config.getMilvusCollection();
        logger.info("Ensuring Milvus collection exists: {}", collectionName);
        
        try {
            logger.debug("Checking if collection exists");
            boolean exists = milvusClient.hasCollection(HasCollectionReq.builder()
                .collectionName(collectionName)
                .build());
            
            if (!exists) {
                logger.info("Collection {} does not exist, creating new collection", collectionName);
                logger.debug("Creating collection schema");
                CreateCollectionReq.CollectionSchema schema = milvusClient.createSchema();

                logger.debug("Adding ID field to schema");
                schema.addField(AddFieldReq.builder()
                    .fieldName("id")
                    .dataType(DataType.Int64)
                    .isPrimaryKey(true)
                    .autoID(true)
                    .build());

                logger.debug("Adding vector field to schema with dimensions: {}", config.getEmbeddingDimensions());
                schema.addField(AddFieldReq.builder()
                    .fieldName("vector")
                    .dataType(DataType.FloatVector)
                    .dimension(config.getEmbeddingDimensions())
                    .build());

                logger.debug("Adding metadata field to schema");
                schema.addField(AddFieldReq.builder()
                    .fieldName("metadata")
                    .dataType(DataType.VarChar)
                    .maxLength(4096)
                    .build());

                logger.debug("Preparing index parameters");
                IndexParam idIndexParam = IndexParam.builder()
                    .fieldName("id")
                    .indexType(IndexParam.IndexType.STL_SORT)
                    .build();

                IndexParam vectorIndexParam = IndexParam.builder()
                    .fieldName("vector")
                    .indexType(IndexParam.IndexType.IVF_FLAT)
                    .metricType(IndexParam.MetricType.COSINE)
                    .extraParams(Collections.singletonMap("nlist", "1024"))
                    .build();

                List<IndexParam> indexParams = Arrays.asList(idIndexParam, vectorIndexParam);

                logger.info("Creating collection with schema and index parameters");
                CreateCollectionReq createReq = CreateCollectionReq.builder()
                    .collectionName(collectionName)
                    .collectionSchema(schema)
                    .indexParams(indexParams)
                    .build();

                milvusClient.createCollection(createReq);
                logger.info("Collection {} created successfully", collectionName);

                logger.debug("Checking collection load state");
                GetLoadStateReq loadStateReq = GetLoadStateReq.builder()
                    .collectionName(collectionName)
                    .build();

                Boolean loaded = milvusClient.getLoadState(loadStateReq);
                logger.info("Collection {} load state: {}", collectionName, loaded);
            } else {
                logger.info("Collection {} already exists", collectionName);
                var collectionInfo = milvusClient.describeCollection(DescribeCollectionReq.builder()
                    .collectionName(collectionName)
                    .build());
                logger.debug("Collection details: {}", collectionInfo);
            }
        } catch (Exception e) {
            logger.error("Failed to ensure Milvus collection: {}", e.getMessage());
            logger.debug("Detailed error", e);
            throw new RuntimeException("Failed to initialize Milvus collection", e);
        }
    }

    @Override
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public float[] generateVector(String text, int dimensions) {
        logger.debug("开始生成向量: textLength={}, dimensions={}", text.length(), dimensions);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL_NAME);
        requestBody.put("input", text);
        requestBody.put("dimensions", dimensions);
        requestBody.put("encoding_format", "float");

        try {
            logger.debug("发送API请求: model={}, dimensions={}", MODEL_NAME, dimensions);
            String response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30)) // 添加超时
                    .doOnError(e -> logger.error("API调用失败: error={}", e.getMessage()))
                    .block();

            logger.debug("API响应成功，解析向量数据");
            var jsonResponse = JSON.parseObject(response);
            var embedding = jsonResponse.getJSONArray("data")
                    .getJSONObject(0)
                    .getJSONArray("embedding")
                    .toJavaList(Float.class);

            float[] vector = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                vector[i] = embedding.get(i);
            }
            
            logger.info("向量生成成功: dimensions={}", vector.length);
            return vector;
        } catch (Exception e) {
            logger.error("向量生成失败: textLength={}, error={}", text.length(), e.getMessage(), e);
            throw new RuntimeException("向量生成失败: " + e.getMessage(), e);
        }
    }

    @Override
    public List<float[]> generateVectors(List<String> texts, int dimensions) {
        if (texts.size() > config.getMaxBatchSize()) {
            throw new IllegalArgumentException("Batch size exceeds maximum limit of " + config.getMaxBatchSize());
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL_NAME);
        requestBody.put("input", texts);
        requestBody.put("dimensions", dimensions);
        requestBody.put("encoding_format", "float");

        try {
            String response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            var jsonResponse = JSON.parseObject(response);
            List<float[]> vectors = new ArrayList<>();
            
            jsonResponse.getJSONArray("data").forEach(obj -> {
                var embedding = ((com.alibaba.fastjson.JSONObject)obj)
                    .getJSONArray("embedding")
                    .toJavaList(Float.class);
                float[] vector = new float[embedding.size()];
                for (int i = 0; i < embedding.size(); i++) {
                    vector[i] = embedding.get(i);
                }
                vectors.add(vector);
            });
            
            return vectors;
        } catch (Exception e) {
            logger.error("Failed to generate vectors in batch: {}", e.getMessage());
            throw new RuntimeException("Batch vector generation failed", e);
        }
    }

    @Override
    public String storeVector(float[] vector, Map<String, Object> metadata) {
        try {
            JsonObject data = new JsonObject();
            data.add("vector", gson.toJsonTree(vector));
            data.add("metadata", gson.toJsonTree(metadata));

            InsertReq insertReq = InsertReq.builder()
                .collectionName(config.getMilvusCollection())
                .data(Collections.singletonList(data))
                .build();
                
            InsertResp response = milvusClient.insert(insertReq);
            return response.getPrimaryKeys().get(0).toString();
        } catch (Exception e) {
            logger.error("Failed to store vector: {}", e.getMessage());
            throw new RuntimeException("Vector storage failed", e);
        }
    }

    @Override
    public List<String> storeVectors(List<float[]> vectors, List<Map<String, Object>> metadata) {
        try {
            List<JsonObject> dataList = new ArrayList<>();
            
            for (int i = 0; i < vectors.size(); i++) {
                JsonObject data = new JsonObject();
                data.add("vector", gson.toJsonTree(vectors.get(i)));
                data.add("metadata", gson.toJsonTree(metadata.get(i)));
                dataList.add(data);
            }
            
            InsertReq insertReq = InsertReq.builder()
                .collectionName(config.getMilvusCollection())
                .data(dataList)
                .build();
                
            InsertResp response = milvusClient.insert(insertReq);
            return response.getPrimaryKeys().stream()
                .map(Object::toString)
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Failed to store vectors in batch: {}", e.getMessage());
            throw new RuntimeException("Batch vector storage failed", e);
        }
    }

    @Override
    @Async("vectorProcessingExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CompletableFuture<String> processChunkAsync(DocChunk chunk) {
        try {
            logger.info("开始向量化处理 [线程: {}]: chunkId={}, fileId={}, chunkIndex={}", 
                Thread.currentThread().getName(), chunk.getId(), chunk.getFileId(), chunk.getChunkIndex());
                
            // 验证和更新状态
            validateVectorStatus(chunk.getId());
            updateChunkStatus(chunk.getId(), VectorStatus.PROCESSING, null);
            
            // 生成向量前记录
            logger.info("开始调用API生成向量: chunkId={}, contentLength={}", 
                chunk.getId(), chunk.getContent().length());
                
            // 生成向量
            float[] vector = generateVector(chunk.getContent(), config.getEmbeddingDimensions());
            logger.info("向量生成完成: chunkId={}, vectorLength={}", chunk.getId(), vector.length);
            
            // 准备存储元数据
            logger.debug("准备存储向量到Milvus: chunkId={}", chunk.getId());
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("fileId", chunk.getFileId());
            metadata.put("chunkIndex", chunk.getChunkIndex());
            metadata.put("content", chunk.getContent());
            
            // 存储向量
            String vectorId = storeVector(vector, metadata);
            logger.info("向量存储完成: chunkId={}, vectorId={}", chunk.getId(), vectorId);
            
            // 更新状态
            chunkRepository.setVectorComplete(chunk.getId(), vectorId, VectorStatus.COMPLETED);
            logger.info("向量化处理完成: chunkId={}", chunk.getId());
            
            return CompletableFuture.completedFuture(vectorId);
        } catch (Exception e) {
            logger.error("向量化处理失败: chunkId={}, error={}", chunk.getId(), e.getMessage(), e);
            String error = e.getMessage();
            updateChunkStatus(chunk.getId(), VectorStatus.FAILED, error);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Retryable(
        value = RuntimeException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000)
    )
    private void validateVectorStatus(Long chunkId) {
        int maxAttempts = 3;
        int attempt = 0;
        while (attempt < maxAttempts) {
            try {
                DocChunk chunk = chunkRepository.findById(chunkId)
                    .orElseThrow(() -> new RuntimeException("Chunk not found: " + chunkId));
                
                if (chunk.getVectorStatus() == null) {
                    logger.warn("Chunk has null vector status: chunkId={}", chunkId);
                    return;
                }
                
                if (VectorStatus.PROCESSING.equals(chunk.getVectorStatus())) {
                    logger.warn("Chunk is already in PROCESSING state: chunkId={}, status={}, attempt={}", 
                        chunkId, chunk.getVectorStatus(), attempt + 1);
                    throw new IllegalStateException("Chunk is already being processed");
                }
                return; // 成功则返回
            } catch (RuntimeException e) {
                attempt++;
                if (attempt >= maxAttempts) {
                    logger.error("Failed to validate vector status after {} attempts: chunkId={}, error={}", 
                        maxAttempts, chunkId, e.getMessage());
                    throw e;
                }
                logger.warn("Failed to validate vector status, will retry: chunkId={}, attempt={}, error={}", 
                    chunkId, attempt, e.getMessage());
                try {
                    Thread.sleep(1000); // 等待1秒后重试
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while retrying", ie);
                }
            }
        }
    }

    @Override
    @Transactional
    public void updateChunkStatus(Long chunkId, String status, String error) {
        DocChunk chunk = chunkRepository.findById(chunkId)
            .orElseThrow(() -> new RuntimeException("Chunk not found: " + chunkId));
        
        String oldStatus = chunk.getVectorStatus();
        chunkRepository.updateStatus(chunkId, status, error);
        
        logger.info("Chunk status changed: chunkId={}, from={} to={}, error={}",
            chunkId, oldStatus, status, error != null ? "present" : "none");
        
        if (error != null) {
            logger.debug("Chunk error details: chunkId={}, error={}", chunkId, error);
        }
    }

    @Override
    @Async("vectorProcessingExecutor")
    @Transactional
    public CompletableFuture<Void> retryFailedChunks(Long fileId) {
        List<DocChunk> failedChunks = chunkRepository.findByFileIdAndVectorStatus(fileId, VectorStatus.FAILED);
        
        logger.info("Found {} failed chunks for fileId={}", failedChunks.size(), fileId);
        
        List<CompletableFuture<String>> futures = failedChunks.stream()
            .filter(chunk -> chunk.getRetryCount() < 3)
            .map(chunk -> {
                logger.info("Retrying chunk processing: chunkId={}, retryCount={}", chunk.getId(), chunk.getRetryCount());
                chunk.resetForRetry();
                chunk.incrementRetryCount();
                chunkRepository.save(chunk);
                return processChunkAsync(chunk);
            })
            .collect(Collectors.toList());
        
        logger.info("Started {} retry tasks for fileId={}", futures.size(), fileId);
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
    }

    @Override
    public Map<String, Object> getProcessingStatus(Long fileId) {
        Map<String, Object> result = new HashMap<>();
        
        List<Map<String, Object>> statusCounts = chunkRepository.getProcessingStatusByFileId(fileId);
        long total = chunkRepository.countByFileId(fileId);
        
        result.put("total", total);
        result.put("details", statusCounts);
        
        return result;
    }
}
