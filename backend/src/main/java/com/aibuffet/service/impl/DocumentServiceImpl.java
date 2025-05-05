package com.aibuffet.service.impl;

import com.aibuffet.common.ResourceNotFoundException;
import com.aibuffet.controller.DocumentController;
import com.aibuffet.model.DocFile;
import com.aibuffet.model.DocFile.Status;
import com.aibuffet.model.DocChunk;
import com.aibuffet.model.KnowledgeBaseFile;
import com.aibuffet.model.VectorStatus;
import com.aibuffet.dto.UploadResult;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.repository.KnowledgeBaseFileRepository;
import com.aibuffet.service.DocumentService;
import com.aibuffet.service.OSSService;
import com.aibuffet.service.VectorService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.persistence.EntityManager;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Propagation;
import com.aibuffet.service.TextProcessingService;
import com.aibuffet.model.TextChunk;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class DocumentServiceImpl implements DocumentService {
    private static final Logger logger = LoggerFactory.getLogger(DocumentServiceImpl.class);

    @Autowired
    private DocFileRepository docFileRepository;

    @Autowired
    private DocChunkRepository docChunkRepository;

    @Autowired
    private KnowledgeBaseFileRepository knowledgeBaseFileRepository;

    @Autowired
    private OSSService ossService;

    @Autowired
    private VectorService vectorService;
    
    @Autowired
    private TextProcessingService textProcessingService;

    @Autowired
    private EntityManager entityManager;

    @Override
    @Transactional
    public UploadResult uploadSingleFile(MultipartFile file, Long knowledgeBaseId, Long userId, String uploadId, DocumentController controller) {
        try {
            String originalFileName = file.getOriginalFilename();
            logger.info("开始处理文件上传: 原始文件名={}, 大小={}, 类型={}, 知识库ID={}", 
                originalFileName, file.getSize(), file.getContentType(), knowledgeBaseId);

            // 验证文件格式
            if (!ossService.isValidKnowledgeDoc(file)) {
                logger.error("文件验证失败: 原始文件名={}, 类型={}", 
                    originalFileName, file.getContentType());
                return UploadResult.error(originalFileName, 
                    "Invalid document format: " + file.getContentType());
            }

            // 计算文件MD5
            String md5Hash = calculateMD5(file);
            logger.debug("文件MD5计算完成: 原始文件名={}, MD5={}", originalFileName, md5Hash);

            // 检查文件是否已存在
            DocFile existingFile = docFileRepository.findByMd5Hash(md5Hash);
            if (existingFile != null) {
                logger.info("发现重复文件: 原始文件名={}, 已存在文件名={}, 文件ID={}, 状态={}", 
                    originalFileName, existingFile.getFileName(), existingFile.getId(), existingFile.getStatus());
                    
                // 如果文件状态为已删除，恢复为激活状态
                if (existingFile.getStatus() == Status.DELETED) {
                    existingFile.setStatus(Status.ACTIVE);
                    existingFile = docFileRepository.save(existingFile);
                    logger.info("恢复已删除文件状态为激活: 文件ID={}", existingFile.getId());
                }
                
                knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, existingFile.getId(), userId));
                logger.info("重复文件关联到知识库成功: 原始文件名={}, 文件ID={}, 知识库ID={}", 
                    originalFileName, existingFile.getId(), knowledgeBaseId);
                return UploadResult.success(originalFileName, existingFile);
            }

            // 上传到OSS
            logger.info("开始上传文件到OSS: 原始文件名={}", originalFileName);
            String fileUrl = ossService.uploadKnowledgeDoc(file, userId, uploadId, originalFileName, controller);
            logger.debug("OSS上传完成，获取到URL: {}", fileUrl);

            logger.info("开始保存文件信息到数据库: 原始文件名={}", originalFileName);
            DocFile docFile = new DocFile();
            docFile.setFileName(originalFileName);
            docFile.setFileType(getFileExtension(originalFileName));
            docFile.setFileSize(file.getSize());
            docFile.setFileUrl(fileUrl);
            docFile.setUploadedBy(userId);
            docFile.setMd5Hash(md5Hash);
            docFile.setProcessingStatus(DocFile.ProcessingStatus.PENDING);
            docFile = docFileRepository.save(docFile);
            logger.info("文件信息已保存到数据库: ID={}, 原始文件名={}", docFile.getId(), docFile.getFileName());

            // 关联文件到知识库
            knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, docFile.getId(), userId));
            logger.info("文件关联到知识库成功: 原始文件名={}, 文件ID={}, 知识库ID={}", 
                originalFileName, docFile.getId(), knowledgeBaseId);

            // 异步触发文档处理
            final Long processedDocId = docFile.getId();
            CompletableFuture<Void> future = processDocumentAsync(docFile);
            future.whenComplete((result, ex) -> {
                if (ex != null) {
                    logger.error("异步处理失败: docId={}, error={}", processedDocId, ex.getMessage());
                }
            });
            logger.info("已触发异步文档处理: docId={}", processedDocId);

            return UploadResult.success(originalFileName, docFile);

        } catch (Exception e) {
            logger.error("文件处理失败: {}, 错误: {}", file.getOriginalFilename(), e.getMessage(), e);
            return UploadResult.error(file.getOriginalFilename(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public List<UploadResult> uploadDocuments(MultipartFile[] files, Long knowledgeBaseId, Long userId, String uploadId, DocumentController controller) {
        List<UploadResult> results = new ArrayList<>();
        logger.info("开始处理文件上传: 文件数={}, 知识库ID={}, 用户ID={}", files.length, knowledgeBaseId, userId);

        for (MultipartFile file : files) {
            UploadResult result = uploadSingleFile(file, knowledgeBaseId, userId, uploadId, controller);
            results.add(result);
            
            // 更新上传进度
            if (result.getFile() != null) {
                controller.updateProgress(uploadId, file.getOriginalFilename(), 100);
            }
        }

        logger.info("文件上传处理完成，成功数={}, 失败数={}", 
            results.stream().filter(r -> r.getFile() != null).count(),
            results.stream().filter(r -> r.getError() != null).count());
        return results;
    }

    @Override
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void deleteDocument(Long docId, Long knowledgeBaseId, Long userId) {
        logger.info("开始从知识库删除文档: docId={}, knowledgeBaseId={}, userId={}", docId, knowledgeBaseId, userId);
        
        // 检查文档存在且为激活状态
        DocFile docFile = docFileRepository.findByIdAndStatus(docId, Status.ACTIVE)
                .orElseThrow(() -> {
                    logger.warn("文档不存在或已删除: docId={}", docId);
                    return new ResourceNotFoundException("Document not found or already deleted");
                });

        // 验证知识库和文档的关联关系
        KnowledgeBaseFile relation = knowledgeBaseFileRepository.findByKbIdAndFileId(knowledgeBaseId, docId)
                .orElseThrow(() -> {
                    logger.warn("文档未关联到该知识库: docId={}, knowledgeBaseId={}", docId, knowledgeBaseId);
                    return new ResourceNotFoundException("Document is not associated with this knowledge base");
                });

        // 验证用户权限
        if (!relation.getCreatedBy().equals(userId)) {
            logger.warn("用户无权限删除该知识库的文档: docId={}, knowledgeBaseId={}, userId={}", 
                docId, knowledgeBaseId, userId);
            throw new IllegalArgumentException("No permission to delete this document from the knowledge base");
        }

        // 删除知识库和文档的关联关系
        knowledgeBaseFileRepository.deleteByKbIdAndFileId(knowledgeBaseId, docId);
        logger.info("已解除文档与知识库的关联: docId={}, knowledgeBaseId={}", docId, knowledgeBaseId);

        // 检查是否还有其他知识库引用这个文档
        long referenceCount = knowledgeBaseFileRepository.countByFileId(docId);
        if (referenceCount == 0) {
            // 没有其他知识库引用这个文档了，标记为删除
            docFile.setStatus(Status.DELETED);
            docFileRepository.save(docFile);
            
            try {
                // 从文档URL中提取对象名并删除OSS文件
                String objectName = extractObjectNameFromUrl(docFile.getFileUrl());
                ossService.deleteFile(objectName);
                logger.info("文档无其他引用，已标记为删除并清理OSS文件: docId={}, objectName={}", docId, objectName);
            } catch (IllegalArgumentException e) {
                logger.error("从URL提取对象名失败: fileUrl={}, error={}", docFile.getFileUrl(), e.getMessage());
                // 即使OSS文件删除失败，仍然保持文档的软删除状态
            } catch (Exception e) {
                logger.error("删除OSS文件失败: docId={}, error={}", docId, e.getMessage());
                // 即使OSS文件删除失败，仍然保持文档的软删除状态
            }
        } else {
            logger.info("文档仍有其他知识库引用({}个), 保持激活状态: docId={}", referenceCount, docId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocFile> getDocuments(Long knowledgeBaseId, int page, int size) {
        logger.info("开始查询文档列表: knowledgeBaseId={}, page={}, size={}", 
            knowledgeBaseId, page, size);
        // 清除一级缓存
        entityManager.clear();
        // 执行查询
        Page<DocFile> result = docFileRepository.findByKbId(knowledgeBaseId, PageRequest.of(page, size));
        logger.info("文档列表查询完成: 总数={}, 总页数={}", 
            result.getTotalElements(), result.getTotalPages());
        return result;
    }

    @Override
    @Transactional
    public void retryProcessing(Long docId, Long userId) {
        logger.info("开始重试文档处理: docId={}, userId={}", docId, userId);
        DocFile docFile = docFileRepository.findById(docId)
                .orElseThrow(() -> {
                    logger.warn("文档不存在: docId={}", docId);
                    return new ResourceNotFoundException("Document not found");
                });

        // 检查用户权限
        KnowledgeBaseFile relation = knowledgeBaseFileRepository.findFirstByFileId(docId)
                .orElseThrow(() -> {
                    logger.warn("文档未关联到任何知识库: docId={}", docId);
                    return new ResourceNotFoundException("Document is not associated with any knowledge base");
                });

        if (!relation.getCreatedBy().equals(userId)) {
            logger.warn("用户无权限重试该文档: docId={}, userId={}", docId, userId);
            throw new IllegalArgumentException("No permission to retry this document");
        }

        // 重置处理状态
        docFile.setProcessingStatus(DocFile.ProcessingStatus.PENDING);
        docFile.setErrorMessage(null);
        docFileRepository.save(docFile);
        
        // 重试文档的失败分块
        vectorService.retryFailedChunks(docId);
        // 重新触发整个文档的处理流程
        processDocumentAsync(docFile);
        logger.info("已触发文档重新处理: docId={}", docId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocChunk> getDocumentChunks(Long docId, Long userId) {
        logger.info("开始获取文档分块: docId={}, userId={}", docId, userId);
        DocFile docFile = docFileRepository.findById(docId)
                .orElseThrow(() -> {
                    logger.warn("文档不存在: docId={}", docId);
                    return new ResourceNotFoundException("Document not found");
                });

        // 检查用户权限
        KnowledgeBaseFile relation = knowledgeBaseFileRepository.findFirstByFileId(docId)
                .orElseThrow(() -> {
                    logger.warn("文档未关联到任何知识库: docId={}", docId);
                    return new ResourceNotFoundException("Document is not associated with any knowledge base");
                });

        if (!relation.getCreatedBy().equals(userId)) {
            logger.warn("用户无权限查看该文档的分块: docId={}, userId={}", docId, userId);
            throw new IllegalArgumentException("No permission to view document chunks");
        }

        List<DocChunk> chunks = docChunkRepository.findByFileIdOrderByChunkIndexAsc(docId);
        logger.info("成功获取文档分块: docId={}, 分块数量={}", docId, chunks.size());
        return chunks;
    }

    private String getFileExtension(String filename) {
        int lastDotPos = filename.lastIndexOf('.');
        return lastDotPos == -1 ? "" : filename.substring(lastDotPos).toLowerCase();
    }

    private String calculateMD5(MultipartFile file) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | IOException e) {
            throw new RuntimeException("Failed to calculate MD5", e);
        }
    }

    @Async("documentProcessingExecutor")
    public CompletableFuture<Void> processDocumentAsync(DocFile docFile) {
        try {
            logger.info("开始异步处理文档 [线程: {}]: docId={}, fileName={}", 
                Thread.currentThread().getName(), docFile.getId(), docFile.getFileName());
            
            // 更新为分块状态
            updateDocStatus(docFile.getId(), DocFile.ProcessingStatus.CHUNKING, null);
            
            // 1. 提取文本（无需事务）
            logger.debug("开始提取文本: docId={}", docFile.getId());
            String text = textProcessingService.extractText(docFile.getFileUrl());
            logger.debug("文本提取完成: docId={}, 文本长度={}", docFile.getId(), text.length());
            
            // 2. 文本分块（无需事务）
            logger.debug("开始文本分块: docId={}", docFile.getId());
            List<TextChunk> textChunks = textProcessingService.createChunks(text);
            logger.info("文本分块完成: docId={}, 分块数={}", docFile.getId(), textChunks.size());
            
            // 更新为向量化状态
            updateDocStatus(docFile.getId(), DocFile.ProcessingStatus.VECTORIZING, null);
            
            // 3. 准备所有分块数据
            List<DocChunk> chunks = new ArrayList<>();
            for (int i = 0; i < textChunks.size(); i++) {
                TextChunk chunk = textChunks.get(i);
                DocChunk docChunk = new DocChunk();
                docChunk.setFileId(docFile.getId());
                docChunk.setContent(chunk.getContent());
                docChunk.setChunkIndex(i);
                docChunk.setTokenCount(chunk.getTokenCount());
                docChunk.setMetadataMap(chunk.getMetadata());
                chunks.add(docChunk);
            }

            // 批量保存分块（使用独立事务方法）
            logger.info("开始批量保存分块: docId={}, 分块数量={}", docFile.getId(), chunks.size());
            List<DocChunk> savedChunks = saveChunks(chunks);
            
            // 4. 触发向量化处理
            logger.info("开始触发向量化处理: docId={}, 总分块数={}", docFile.getId(), savedChunks.size());
            for (DocChunk chunk : savedChunks) {
                logger.info("触发向量化处理: docId={}, chunkId={}, chunkIndex={}", 
                    docFile.getId(), chunk.getId(), chunk.getChunkIndex());
                vectorService.processChunkAsync(chunk);
            }
            
            logger.info("文档处理完成: docId={}, 总分块数={}", docFile.getId(), savedChunks.size());
            return CompletableFuture.completedFuture(null);
            
        } catch (Exception e) {
            logger.error("文档处理失败: docId={}, error={}", docFile.getId(), e.getMessage(), e);
            updateDocStatus(docFile.getId(), DocFile.ProcessingStatus.FAILED, e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }

    @Transactional
    private List<DocChunk> saveChunks(List<DocChunk> chunks) {
        return docChunkRepository.saveAll(chunks);
    }

    @Transactional
    private void updateDocStatus(Long docId, DocFile.ProcessingStatus status, String error) {
        DocFile docFile = docFileRepository.findById(docId)
            .orElseThrow(() -> new RuntimeException("Document not found: " + docId));
        docFile.setProcessingStatus(status);
        docFile.setErrorMessage(error);
        docFileRepository.save(docFile);
        logger.info("更新文档状态: docId={}, status={}, error={}", docId, status, error);
    }

    private String extractObjectNameFromUrl(String fileUrl) {
        if (fileUrl == null) {
            throw new IllegalArgumentException("File URL cannot be null");
        }
        
        int docIndex = fileUrl.indexOf("/knowledgebase-doc/");
        if (docIndex == -1) {
            throw new IllegalArgumentException("Invalid file URL format: missing /knowledgebase-doc/ path");
        }
        
        int questionMarkIndex = fileUrl.indexOf('?');
        String urlWithoutParams = questionMarkIndex == -1 ? fileUrl : fileUrl.substring(0, questionMarkIndex);
        
        return urlWithoutParams.substring(docIndex);
    }
}
