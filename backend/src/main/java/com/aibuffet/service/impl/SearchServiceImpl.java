package com.aibuffet.service.impl;

import com.aibuffet.dto.SearchRequest;
import com.aibuffet.dto.SearchResult;
import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.KnowledgeBaseRepository;
import com.aibuffet.service.SearchService;
import com.aibuffet.service.TextProcessingService;
import com.aibuffet.service.VectorService;
import com.aibuffet.config.VectorServiceConfig;
import io.milvus.v2.client.MilvusClientV2;
import io.milvus.v2.service.collection.request.LoadCollectionReq;
import io.milvus.v2.service.vector.request.SearchReq;
import io.milvus.v2.service.vector.request.data.FloatVec;
import io.milvus.v2.service.vector.response.SearchResp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SearchServiceImpl implements SearchService {
    private static final Logger logger = LoggerFactory.getLogger(SearchServiceImpl.class);

    @Value("${search.merge-threshold:50}")
    private int mergeThreshold;

    @Value("${milvus.collection-name}")
    private String collectionName;

    private final TextProcessingService textProcessingService;
    private final VectorService vectorService;
    private final MilvusClientV2 milvusClient;
    private final DocChunkRepository chunkRepository;
    private final DocFileRepository fileRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final VectorServiceConfig vectorConfig;

    @Autowired
    public SearchServiceImpl(
            TextProcessingService textProcessingService,
            VectorService vectorService,
            MilvusClientV2 milvusClient,
            DocChunkRepository chunkRepository,
            DocFileRepository fileRepository,
            KnowledgeBaseRepository knowledgeBaseRepository,
            JdbcTemplate jdbcTemplate,
            VectorServiceConfig vectorConfig) {
        this.textProcessingService = textProcessingService;
        this.vectorService = vectorService;
        this.milvusClient = milvusClient;
        this.chunkRepository = chunkRepository;
        this.fileRepository = fileRepository;
        this.knowledgeBaseRepository = knowledgeBaseRepository;
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
        this.vectorConfig = vectorConfig;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SearchResult> search(SearchRequest request) {
        logger.info("开始执行检索: query={}, kbIds={}", request.getQuery(), request.getKnowledgeBaseIds());

        try {
            // 1. 获取文件ID列表
            List<Long> fileIds = getKnowledgeBaseFileIds(request.getKnowledgeBaseIds());
            if (fileIds.isEmpty()) {
                logger.info("未找到相关文件");
                return Collections.emptyList();
            }

            // 2. 预处理查询文本
            String processedQuery = request.getQuery().trim().replaceAll("\\s+", " ");

            // 3. 生成查询向量
            float[] queryVector = vectorService.generateVector(processedQuery, vectorConfig.getEmbeddingDimensions());

            // 4. 执行向量检索
            List<SearchResult> results = searchVectors(queryVector, fileIds, request);

            // 5. 结果后处理
            return postProcessResults(results);

        } catch (Exception e) {
            logger.error("检索执行失败: {}", e.getMessage(), e);
            throw new RuntimeException("检索执行失败: " + e.getMessage(), e);
        }
    }

    private List<Long> getKnowledgeBaseFileIds(List<Long> knowledgeBaseIds) {
        String sql = "SELECT DISTINCT file_id FROM knowledge_base_files WHERE kb_id IN (:kbIds)";
        MapSqlParameterSource parameters = new MapSqlParameterSource();
        parameters.addValue("kbIds", knowledgeBaseIds);
        return namedParameterJdbcTemplate.queryForList(sql, parameters, Long.class);
    }

    private List<SearchResult> searchVectors(float[] queryVector, List<Long> fileIds, SearchRequest request) {
        logger.debug("执行向量检索: fileIds={}, threshold={}", fileIds, request.getSimilarityThreshold());

        try {
            // 确保集合已加载
            milvusClient.loadCollection(
                LoadCollectionReq.builder()
                    .collectionName(collectionName)
                    .build());

            // 构造查询向量数据
            FloatVec vectorData = new FloatVec(queryVector);

            // 构建过滤条件
            String expr = String.format("file_id in [%s]",
                fileIds.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(",")));

            // 构建搜索参数
            Map<String, Object> searchParams = new HashMap<>();
            searchParams.put("metric_type", "IP");
            searchParams.put("params", "{\"nprobe\": 10}");
            searchParams.put("hints", "iterative_filter");

            // 执行搜索
            SearchReq searchReq = SearchReq.builder()
                .collectionName(collectionName)
                .data(Collections.singletonList(vectorData))
                .topK(request.getLimit())
                .filter(expr)
                .outputFields(Arrays.asList("id", "metadata", "content"))
                .searchParams(searchParams)
                .build();

            SearchResp searchResp = milvusClient.search(searchReq);
            return parseSearchResults(searchResp);

        } catch (Exception e) {
            logger.error("向量检索失败: {}", e.getMessage(), e);
            throw new RuntimeException("向量检索失败", e);
        }
    }

    private List<SearchResult> parseSearchResults(SearchResp searchResp) {
        List<SearchResult> results = new ArrayList<>();
        
        List<List<SearchResp.SearchResult>> searchResults = searchResp.getSearchResults();
        if (searchResults.isEmpty()) {
            return results;
        }

        // 只处理第一个查询向量的结果
        List<SearchResp.SearchResult> firstQueryResults = searchResults.get(0);
        
        for (SearchResp.SearchResult result : firstQueryResults) {
            try {
                Map<String, Object> entity = result.getEntity();
                long chunkId = ((Number) entity.get("id")).longValue();
                
                // 查询chunk和file信息
                DocChunk chunk = chunkRepository.findById(chunkId)
                    .orElseThrow(() -> new RuntimeException("找不到对应的文本块: " + chunkId));
                    
                DocFile file = fileRepository.findById(chunk.getFileId())
                    .orElseThrow(() -> new RuntimeException("找不到对应的文件: " + chunk.getFileId()));
                
                // 构建搜索结果
                SearchResult searchResult = new SearchResult();
                searchResult.setContent(chunk.getContent());
                searchResult.setFileId(file.getId());
                searchResult.setFileName(file.getFileName());
                searchResult.setSimilarity(result.getScore());
                searchResult.setChunkId(chunk.getId());
                searchResult.setChunkIndex(chunk.getChunkIndex());
                
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("fileType", file.getFileType());
                metadata.put("fileSize", file.getFileSize());
                searchResult.setMetadata(metadata);
                
                results.add(searchResult);
            } catch (Exception e) {
                logger.error("解析搜索结果失败: {}", e.getMessage());
                // 继续处理下一个结果
            }
        }
        
        return results;
    }

    private List<SearchResult> postProcessResults(List<SearchResult> results) {
        if (results.isEmpty()) {
            return results;
        }

        // 1. 按文件分组
        Map<Long, List<SearchResult>> fileGroups = results.stream()
            .collect(Collectors.groupingBy(SearchResult::getFileId));

        // 2. 处理每个文件内的结果
        return fileGroups.values().stream()
            .map(this::mergeAdjacentChunks)
            .flatMap(Collection::stream)
            .sorted(Comparator.comparing(SearchResult::getSimilarity).reversed())
            .collect(Collectors.toList());
    }

    private List<SearchResult> mergeAdjacentChunks(List<SearchResult> chunks) {
        if (chunks.size() <= 1) {
            return chunks;
        }

        // 按chunk索引排序
        chunks.sort(Comparator.comparing(SearchResult::getChunkIndex));
        
        List<SearchResult> mergedResults = new ArrayList<>();
        SearchResult current = chunks.get(0);
        
        for (int i = 1; i < chunks.size(); i++) {
            SearchResult next = chunks.get(i);
            
            // 如果是相邻的块且内容长度合适，则合并
            if (next.getChunkIndex() - current.getChunkIndex() == 1 &&
                current.getContent().length() + next.getContent().length() <= mergeThreshold) {
                
                // 合并内容和更新相似度
                current.setContent(current.getContent() + " " + next.getContent());
                current.setSimilarity(Math.max(current.getSimilarity(), next.getSimilarity()));
                
            } else {
                mergedResults.add(current);
                current = next;
            }
        }
        
        // 添加最后一个块
        mergedResults.add(current);
        
        return mergedResults;
    }

    @Override
    public boolean validateSearchPermission(List<Long> knowledgeBaseIds, Long userId) {
        String sql = "SELECT COUNT(DISTINCT kb.id) " +
                    "FROM knowledge_bases kb " +
                    "WHERE kb.id IN (:kbIds) " +
                    "AND (kb.visibility = 'PUBLIC' OR kb.created_by = :userId)";
        
        MapSqlParameterSource parameters = new MapSqlParameterSource();
        parameters.addValue("kbIds", knowledgeBaseIds);
        parameters.addValue("userId", userId);
        
        Integer accessibleCount = namedParameterJdbcTemplate.queryForObject(sql, parameters, Integer.class);
        
        return accessibleCount != null && accessibleCount == knowledgeBaseIds.size();
    }
}
