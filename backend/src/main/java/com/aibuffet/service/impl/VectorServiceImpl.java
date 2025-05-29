package com.aibuffet.service.impl;

import com.aibuffet.config.VectorServiceConfig;
import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import com.aibuffet.model.Model;
import com.aibuffet.model.VectorStatus;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.repository.DocFileRepository;
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
import org.springframework.transaction.annotation.Isolation;
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

    private final VectorServiceConfig config;
    private final ModelRepository modelRepository;
    private final DocChunkRepository chunkRepository;
    private final DocFileRepository docFileRepository;
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
            DocFileRepository docFileRepository,
            WebClient.Builder webClientBuilder,
            MilvusClientV2 milvusClient) {
        this.config = config;
        this.modelRepository = modelRepository;
        this.chunkRepository = chunkRepository;
        this.docFileRepository = docFileRepository;
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
            logger.debug("Found vector model: {}", vectorModel.getName());
            
            logger.debug("Configuring web client");
            webClient = webClientBuilder
                    .baseUrl("")  // 空baseUrl，因为我们使用完整URL
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

                logger.debug("Adding fileId field to schema");
                schema.addField(AddFieldReq.builder()
                    .fieldName("fileId")
                    .dataType(DataType.Int64)
                    .build());

                logger.debug("Adding chunkId field to schema");
                schema.addField(AddFieldReq.builder()
                    .fieldName("chunkId")
                    .dataType(DataType.Int64)
                    .build());

                logger.debug("Adding chunkIndex field to schema");
                schema.addField(AddFieldReq.builder()
                    .fieldName("chunkIndex")
                    .dataType(DataType.Int64)
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
            requestBody.put("model", vectorModel.getName());
            requestBody.put("input", text);
            requestBody.put("dimensions", dimensions);
            requestBody.put("encoding_format", "float");

        try {
            logger.debug("发送API请求: model={}, dimensions={}", vectorModel.getName(), dimensions);
            String response = webClient.post()
                    .uri(vectorModel.getBaseUrl())
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
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
        requestBody.put("model", vectorModel.getName());
        requestBody.put("input", texts);
        requestBody.put("dimensions", dimensions);
        requestBody.put("encoding_format", "float");

        try {
            String response = webClient.post()
                    .uri(vectorModel.getBaseUrl())
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
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
    public String storeVector(float[] vector, Long fileId, Long chunkId, Integer chunkIndex) {
        try {
            JsonObject data = new JsonObject();
            data.add("vector", gson.toJsonTree(vector));
            data.addProperty("fileId", fileId);
            data.addProperty("chunkId", chunkId);
            data.addProperty("chunkIndex", chunkIndex);
            
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
    public List<String> storeVectors(List<float[]> vectors, List<Long> fileIds, List<Long> chunkIds, List<Integer> chunkIndexes) {
        try {
            if (vectors.size() != fileIds.size() || vectors.size() != chunkIds.size() || vectors.size() != chunkIndexes.size()) {
                throw new IllegalArgumentException("All input lists must have the same size");
            }
            
            List<JsonObject> dataList = new ArrayList<>();
            for (int i = 0; i < vectors.size(); i++) {
                JsonObject data = new JsonObject();
                data.add("vector", gson.toJsonTree(vectors.get(i)));
                data.addProperty("fileId", fileIds.get(i));
                data.addProperty("chunkId", chunkIds.get(i));
                data.addProperty("chunkIndex", chunkIndexes.get(i));
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
    @Transactional
    public String processChunk(DocChunk chunk, float[] vector) {
        try {
            logger.info("开始向量化处理: chunkId={}, fileId={}, chunkIndex={}", 
                chunk.getId(), chunk.getFileId(), chunk.getChunkIndex());
            
            // 存储向量
            String vectorId = storeVector(vector, chunk.getFileId(), chunk.getId(), chunk.getChunkIndex());
            logger.info("向量存储完成: chunkId={}, vectorId={}", chunk.getId(), vectorId);
            
            // 更新完成状态
            chunkRepository.setVectorComplete(chunk.getId(), vectorId, VectorStatus.COMPLETED);
            
            logger.info("向量化处理完成: chunkId={}", chunk.getId());
            return vectorId;
        } catch (Exception e) {
            logger.error("向量化处理失败: chunkId={}, error={}", chunk.getId(), e.getMessage(), e);
            chunkRepository.updateStatus(chunk.getId(), VectorStatus.FAILED, e.getMessage());
            throw e;
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW,
                  isolation = Isolation.READ_COMMITTED,
                  timeout = 30)
    public void updateChunkStatus(Long chunkId, String status, String error) {
        try {
            chunkRepository.updateStatus(chunkId, status, error);
            logger.debug("更新状态成功: chunkId={}, status={}, error={}", 
                chunkId, status, error != null ? "present" : "none");
        } catch (Exception e) {
            logger.error("更新状态失败: chunkId={}, status={}, error={}", 
                chunkId, status, e.getMessage());
            throw e;
        }
    }

    @Override
    @Async("documentProcessingExecutor")
    @Transactional(isolation = Isolation.READ_COMMITTED,
                  timeout = 30)
    public CompletableFuture<Void> retryFailedChunks(Long fileId) {
        List<DocChunk> failedChunks = chunkRepository.findByFileIdAndVectorStatus(fileId, VectorStatus.FAILED);
        
        logger.info("Found {} failed chunks for fileId={}", failedChunks.size(), fileId);
        
        for (DocChunk chunk : failedChunks) {
            if (chunk.getRetryCount() >= 3) {
                continue;
            }
            
            try {
                logger.info("Retrying chunk processing: chunkId={}, retryCount={}", 
                    chunk.getId(), chunk.getRetryCount());
                
                chunk.resetForRetry();
                chunk.incrementRetryCount();
                chunkRepository.save(chunk);
                
                // 生成向量
                float[] vector = generateVector(chunk.getContent(), config.getEmbeddingDimensions());
                // 处理向量化
                processChunk(chunk, vector);
                
            } catch (Exception e) {
                logger.error("Retry failed for chunk: chunkId={}, error={}", 
                    chunk.getId(), e.getMessage(), e);
            }
        }
        
        logger.info("Completed retry processing for fileId={}", fileId);
        return CompletableFuture.completedFuture(null);
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
