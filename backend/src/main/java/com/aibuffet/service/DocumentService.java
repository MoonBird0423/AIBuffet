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
     * 获取知识库的文档列表（只返回激活状态的文档）
     */
    Page<DocFile> getDocuments(Long knowledgeBaseId, int page, int size);

    /**
     * 重新处理文档
     */
    void retryProcessing(Long docId, Long userId);

    /**
     * 获取文档的分块列表
     */
    List<DocChunk> getDocumentChunks(Long docId, Long userId);
}
