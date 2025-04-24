package com.aibuffet.service.impl;

import com.aibuffet.config.VectorServiceConfig;
import com.aibuffet.model.Model;
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
import io.milvus.v2.service.index.request.CreateIndexReq;
import io.milvus.v2.service.index.request.DescribeIndexReq;
import io.milvus.v2.service.index.response.DescribeIndexResp;
import io.milvus.v2.service.vector.request.InsertReq;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;

@Service
public class VectorServiceImpl implements VectorService {
    private static final Logger logger = LoggerFactory.getLogger(VectorServiceImpl.class);
    private static final String VECTOR_MODEL_PURPOSE = "向量化";
    private static final String MODEL_NAME = "text-embedding-v3";
    private static final String INDEX_NAME = "vector_index";

    private final VectorServiceConfig config;
    private final ModelRepository modelRepository;
    private final WebClient.Builder webClientBuilder;
    private final MilvusClientV2 milvusClient;
    private final Gson gson;

    private Model vectorModel;
    private WebClient webClient;

    @Autowired
    public VectorServiceImpl(
            VectorServiceConfig config,
            ModelRepository modelRepository,
            WebClient.Builder webClientBuilder,
            MilvusClientV2 milvusClient) {
        this.config = config;
        this.modelRepository = modelRepository;
        this.webClientBuilder = webClientBuilder;
        this.milvusClient = milvusClient;
        this.gson = new Gson();
    }

    @PostConstruct
    public void init() {
        // 初始化向量模型配置
        vectorModel = modelRepository.findByPurposeExact(VECTOR_MODEL_PURPOSE)
                .orElseThrow(() -> new RuntimeException("Vector model not found"));
        
        // 初始化WebClient
        webClient = webClientBuilder
                .baseUrl(vectorModel.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + vectorModel.getApiKey())
                .build();

        // 确保Milvus集合存在
        ensureMilvusCollection();
    }

    private void ensureMilvusCollection() {
        String collectionName = config.getMilvusCollection();
        
        try {
            // 检查集合是否存在
            var describeReq = DescribeCollectionReq.builder()
                .collectionName(collectionName)
                .build();
            
            var response = milvusClient.describeCollection(describeReq);
            
            if (response == null || response.getCollectionName() == null) {
                // 创建集合的schema
                CreateCollectionReq.CollectionSchema schema = milvusClient.createSchema();

                // 添加ID字段
                schema.addField(AddFieldReq.builder()
                    .fieldName("id")
                    .dataType(DataType.Int64)
                    .isPrimaryKey(true)
                    .autoID(true)
                    .build());

                // 添加向量字段
                int dimensions = config.getEmbeddingDimensions();
                schema.addField(AddFieldReq.builder()
                    .fieldName("vector")
                    .dataType(DataType.FloatVector)
                    .dimension(dimensions)
                    .build());

                // 添加元数据字段
                schema.addField(AddFieldReq.builder()
                    .fieldName("metadata")
                    .dataType(DataType.VarChar)
                    .maxLength(4096)
                    .build());

                // 创建集合
                CreateCollectionReq createReq = CreateCollectionReq.builder()
                    .collectionName(collectionName)
                    .collectionSchema(schema)
                    .build();

                milvusClient.createCollection(createReq);
                
                // 创建向量索引
                IndexParam indexParam = IndexParam.builder()
                    .fieldName("vector")
                    .indexName(INDEX_NAME)
                    .indexType(IndexParam.IndexType.IVF_FLAT)
                    .metricType(IndexParam.MetricType.COSINE)
                    .extraParams(Map.of("nlist", 128))
                    .build();

                List<IndexParam> indexParams = new ArrayList<>();
                indexParams.add(indexParam);

                CreateIndexReq indexReq = CreateIndexReq.builder()
                    .collectionName(collectionName)
                    .indexParams(indexParams)
                    .build();
                
                milvusClient.createIndex(indexReq);
                
                logger.info("Milvus collection and index created: {}", collectionName);
            } else {
                logger.info("Milvus collection already exists: {}", collectionName);
                
                // 检查索引是否存在
                DescribeIndexReq describeIndexReq = DescribeIndexReq.builder()
                    .collectionName(collectionName)
                    .indexName(INDEX_NAME)
                    .build();
                
                try {
                    DescribeIndexResp describeIndexResp = milvusClient.describeIndex(describeIndexReq);
                    logger.info("Index exists: {}", describeIndexResp);
                } catch (Exception e) {
                    logger.warn("Index does not exist, creating...");
                    // 创建索引
                    IndexParam indexParam = IndexParam.builder()
                        .fieldName("vector")
                        .indexName(INDEX_NAME)
                        .indexType(IndexParam.IndexType.IVF_FLAT)
                        .metricType(IndexParam.MetricType.COSINE)
                        .extraParams(Map.of("nlist", 128))
                        .build();

                    List<IndexParam> indexParams = new ArrayList<>();
                    indexParams.add(indexParam);

                    CreateIndexReq indexReq = CreateIndexReq.builder()
                        .collectionName(collectionName)
                        .indexParams(indexParams)
                        .build();
                    
                    milvusClient.createIndex(indexReq);
                    logger.info("Index created successfully");
                }
            }
        } catch (Exception e) {
            logger.error("Failed to ensure Milvus collection: {}", e.getMessage());
            throw new RuntimeException("Failed to initialize Milvus collection", e);
        }
    }

    @Override
    @Retryable(
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000))
    public float[] generateVector(String text, int dimensions) {
        logger.debug("Generating vector for text (length: {})", text.length());
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", MODEL_NAME);
        requestBody.put("input", text);
        requestBody.put("dimensions", dimensions);
        requestBody.put("encoding_format", "float");

        try {
            String response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            var jsonResponse = JSON.parseObject(response);
            var embedding = jsonResponse.getJSONArray("data")
                    .getJSONObject(0)
                    .getJSONArray("embedding")
                    .toJavaList(Float.class);

            float[] vector = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                vector[i] = embedding.get(i);
            }
            
            logger.debug("Vector generation successful, dimension: {}", vector.length);
            return vector;
        } catch (Exception e) {
            logger.error("Failed to generate vector: {}", e.getMessage());
            throw new RuntimeException("Vector generation failed", e);
        }
    }

    @Override
    public List<float[]> generateVectors(List<String> texts, int dimensions) {
        if (texts.size() > config.getMaxBatchSize()) {
            throw new IllegalArgumentException("Batch size exceeds maximum limit of " + config.getMaxBatchSize());
        }

        logger.debug("Generating vectors for {} texts", texts.size());
        
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
        logger.debug("Storing vector with metadata: {}", metadata);
        
        try {
            JsonObject data = new JsonObject();
            data.add("vector", gson.toJsonTree(vector));
            data.add("metadata", gson.toJsonTree(metadata));

            InsertReq insertReq = InsertReq.builder()
                .collectionName(config.getMilvusCollection())
                .data(Collections.singletonList(data))
                .build();
                
            var response = milvusClient.insert(insertReq);
            
            String id = response.getPrimaryKeys().get(0).toString();
            logger.debug("Vector stored successfully with ID: {}", id);
            return id;
        } catch (Exception e) {
            logger.error("Failed to store vector: {}", e.getMessage());
            throw new RuntimeException("Vector storage failed", e);
        }
    }

    @Override
    public List<String> storeVectors(List<float[]> vectors, List<Map<String, Object>> metadata) {
        logger.debug("Storing {} vectors", vectors.size());
        
        try {
            List<JsonObject> records = new ArrayList<>();
            
            for (int i = 0; i < vectors.size(); i++) {
                JsonObject data = new JsonObject();
                data.add("vector", gson.toJsonTree(vectors.get(i)));
                data.add("metadata", gson.toJsonTree(metadata.get(i)));
                records.add(data);
            }
            
            InsertReq insertReq = InsertReq.builder()
                .collectionName(config.getMilvusCollection())
                .data(records)
                .build();
                
            var response = milvusClient.insert(insertReq);
            
            List<String> ids = response.getPrimaryKeys().stream()
                .map(Object::toString)
                .collect(Collectors.toList());
                    
            logger.debug("Vectors stored successfully, count: {}", ids.size());
            return ids;
        } catch (Exception e) {
            logger.error("Failed to store vectors in batch: {}", e.getMessage());
            throw new RuntimeException("Batch vector storage failed", e);
        }
    }
}
