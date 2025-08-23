package com.aibuffet.service;

import com.aibuffet.controller.DocumentController;
import com.aibuffet.dto.UploadResult;
import com.aibuffet.dto.DocFileSummary;
import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface DocumentService {
    /**
     * 上传单个文件
     */
    UploadResult uploadSingleFile(MultipartFile file, Long knowledgeBaseId, Long userId, String uploadId, DocumentController controller);

    /**
     * 批量上传文档并保存到知识库
     */
    List<UploadResult> uploadDocuments(MultipartFile[] files, Long knowledgeBaseId, Long userId, String uploadId, DocumentController controller);

    /**
     * 从知识库中删除文档
     */
    void deleteDocument(Long docId, Long knowledgeBaseId, Long userId);

    /**
     * 获取文档列表，支持按知识库、关键词和分类筛选（只返回激活状态的文档）
     * 
     * @param knowledgeBaseId 知识库ID，可选
     * @param keyword 搜索关键词，可选，用于搜索文档名称
     * @param category 文档分类，可选
     * @param relationType 关联关系类型，可选，用于区分上传和收藏
     * @param sortBy 排序方式，newest（最新）或oldest（最旧）
     * @param page 页码，从0开始
     * @param size 每页大小
     * @param userId 用户ID，可选，为null时只返回公开发布的文档
     * @return 分页的文档列表
     */
    Page<DocFileSummary> getDocuments(Long knowledgeBaseId, String keyword, DocFile.Category category, String relationType, String sortBy, int page, int size, Long userId);

    /**
     * 重新处理文档
     */
    void retryProcessing(Long docId, Long userId);

    /**
     * 获取文档的分块列表（分页）
     */
    Map<String, Object> getDocumentChunks(Long docId, Long userId, int page, int size);

    /**
     * 获取文档的分块列表（全部）
     */
    List<DocChunk> getDocumentChunks(Long docId, Long userId);

    /**
     * 更新文档基本信息
     */
    void updateDocumentInfo(Long docId, Long userId, String coverUrl, DocFile.Category category,
            String author, String fileName, String description);

    /**
     * 更新发布状态
     */
    void updatePublishStatus(Long docId, Long userId, DocFile.PublishStatus status);

    /**
     * 获取单个文档详情
     * 
     * @param docId 文档ID
     * @param userId 用户ID，可选，为null时只能访问公开发布的文档
     * @return 文档详情
     * @throws com.aibuffet.common.ResourceNotFoundException 当文档不存在时
     * @throws IllegalArgumentException 当用户无权限访问该文档时
     */
    DocFile getDocument(Long docId, Long userId);

    /**
     * 收藏文档到知识库
     * 
     * @param docId 文档ID
     * @param knowledgeBaseId 知识库ID
     * @param userId 用户ID
     * @throws com.aibuffet.common.ResourceNotFoundException 当文档或知识库不存在时
     * @throws IllegalArgumentException 当用户无权限访问该知识库时
     */
    void favoriteDocument(Long docId, Long knowledgeBaseId, Long userId);

    /**
     * 取消收藏文档
     * 
     * @param docId 文档ID
     * @param knowledgeBaseId 知识库ID
     * @param userId 用户ID
     * @throws com.aibuffet.common.ResourceNotFoundException 当文档或知识库不存在时
     * @throws IllegalArgumentException 当用户无权限访问该知识库时
     */
    void unfavoriteDocument(Long docId, Long knowledgeBaseId, Long userId);
}
