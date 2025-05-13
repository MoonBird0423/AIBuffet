package com.aibuffet.service;

import com.aibuffet.controller.DocumentController;
import com.aibuffet.dto.UploadResult;
import com.aibuffet.model.DocChunk;
import com.aibuffet.model.DocFile;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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
     * @param page 页码，从0开始
     * @param size 每页大小
     * @return 分页的文档列表
     */
    Page<DocFile> getDocuments(Long knowledgeBaseId, String keyword, DocFile.Category category, int page, int size);

    /**
     * 重新处理文档
     */
    void retryProcessing(Long docId, Long userId);

    /**
     * 获取文档的分块列表
     */
    List<DocChunk> getDocumentChunks(Long docId, Long userId);

    /**
     * 更新文档基本信息
     */
    void updateDocumentInfo(Long docId, Long userId, String coverUrl, DocFile.Category category, String author);

    /**
     * 更新发布状态
     */
    void updatePublishStatus(Long docId, Long userId, DocFile.PublishStatus status);

    /**
     * 增加学习人数
     */
    void incrementLearnerCount(Long docId);
}
