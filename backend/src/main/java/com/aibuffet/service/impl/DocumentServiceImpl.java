package com.aibuffet.service.impl;

import com.aibuffet.common.ResourceNotFoundException;
import com.aibuffet.controller.DocumentController;
import com.aibuffet.model.*;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.DocChunkRepository;
import com.aibuffet.repository.KnowledgeBaseFileRepository;
import com.aibuffet.service.*;
import com.aibuffet.service.processing.*;
import com.aibuffet.service.processing.stages.*;
import com.aibuffet.dto.UploadResult;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.persistence.EntityManager;

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

    @Async("documentProcessingExecutor")
    public CompletableFuture<Void> processDocumentAsync(DocFile docFile) {
        try {
            processDocument(docFile);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            logger.error("异步处理失败: docId={}, error={}", docFile.getId(), e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

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
                if (existingFile.getStatus() == DocFile.Status.DELETED) {
                    existingFile.setStatus(DocFile.Status.ACTIVE);
                    existingFile = docFileRepository.save(existingFile);
                    logger.info("恢复已删除文件状态为激活: 文件ID={}", existingFile.getId());
                }
                
                // 检查是否需要重新处理文本
                if (existingFile.getExtractedText() == null && 
                    existingFile.getProcessingStatus() != DocFile.ProcessingStatus.EXTRACTING_TEXT) {
                    logger.info("重复文件尚未提取文本，触发处理: fileId={}", existingFile.getId());
                    processDocumentAsync(existingFile);
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
        DocFile docFile = docFileRepository.findByIdAndStatus(docId, DocFile.Status.ACTIVE)
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
            docFile.setStatus(DocFile.Status.DELETED);
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
    public Page<DocFile> getDocuments(Long knowledgeBaseId, String keyword, DocFile.Category category, int page, int size) {
        logger.info("DocumentService: 开始查询文档列表: knowledgeBaseId={}, keyword={}, category={}, page={}, size={}", 
            knowledgeBaseId, keyword, category, page, size);
        // 清除一级缓存
        entityManager.clear();
        
        Page<DocFile> result;
        if (knowledgeBaseId != null) {
            logger.info("DocumentService: 使用知识库查询分支");
            // 如果指定了知识库ID，则搜索该知识库下的文档
            if (keyword != null && category != null) {
                logger.info("DocumentService: 执行知识库下的关键词+分类查询");
                result = docFileRepository.findByKbIdAndFileNameContainingAndCategory(
                    knowledgeBaseId, keyword, category.name(), PageRequest.of(page, size));
            } else if (keyword != null) {
                logger.info("DocumentService: 执行知识库下的关键词查询");
                result = docFileRepository.findByKbIdAndFileNameContaining(
                    knowledgeBaseId, keyword, PageRequest.of(page, size));
            } else if (category != null) {
                logger.info("DocumentService: 执行知识库下的分类查询");
                result = docFileRepository.findByKbIdAndCategory(
                    knowledgeBaseId, category.name(), PageRequest.of(page, size));
            } else {
                logger.info("DocumentService: 执行知识库下的全部查询");
                result = docFileRepository.findByKbId(
                    knowledgeBaseId, PageRequest.of(page, size));
            }
        } else {
            logger.info("DocumentService: 使用公共图书馆查询分支");
            // 如果没有指定知识库ID，则搜索所有已发布的文档
            String publishStatusStr = DocFile.PublishStatus.PUBLISHED.name();
            if (keyword != null && category != null) {
                logger.info("DocumentService: 执行公共图书馆关键词+分类查询");
                result = docFileRepository.findByFileNameContainingAndCategoryAndPublishStatus(
                    keyword, category.name(), publishStatusStr, PageRequest.of(page, size));
            } else if (keyword != null) {
                logger.info("DocumentService: 执行公共图书馆关键词查询");
                result = docFileRepository.findByFileNameContainingAndPublishStatus(
                    keyword, publishStatusStr, PageRequest.of(page, size));
            } else if (category != null) {
                logger.info("DocumentService: 执行公共图书馆分类查询");
                result = docFileRepository.findByCategoryAndPublishStatus(
                    category.name(), publishStatusStr, PageRequest.of(page, size));
            } else {
                logger.info("DocumentService: 执行公共图书馆全部查询");
                result = docFileRepository.findByPublishStatus(
                    publishStatusStr, PageRequest.of(page, size));
            }
        }
        
        logger.info("DocumentService: 文档列表查询完成: 总数={}, 总页数={}, 当前页数据量={}", 
            result.getTotalElements(), result.getTotalPages(), result.getContent().size());
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

    @Autowired
    private ProcessingQueue processingQueue;

    @Autowired
    private TextExtractionStage textExtractionStage;

    @Autowired
    private ChunkingStage chunkingStage;

    @Autowired
    private VectorizationStage vectorizationStage;

    private void processDocument(DocFile docFile) {
        // 创建处理上下文
        ProcessContext context = new ProcessContext(docFile);
        
        // 按顺序创建处理任务
        ProcessingTask textExtractionTask = ProcessingTask.builder()
            .docId(docFile.getId())
            .type(ProcessingTask.TaskType.TEXT_EXTRACTION)
            .context(context)
            .processor(textExtractionStage)
            .build();
            
        ProcessingTask chunkingTask = ProcessingTask.builder()
            .docId(docFile.getId())
            .type(ProcessingTask.TaskType.CHUNKING)
            .context(context)
            .processor(chunkingStage)
            .build();
            
        ProcessingTask vectorizationTask = ProcessingTask.builder()
            .docId(docFile.getId())
            .type(ProcessingTask.TaskType.VECTORIZATION)
            .context(context)
            .processor(vectorizationStage)
            .build();
        
        // 将任务添加到处理队列
        processingQueue.enqueue(textExtractionTask);
        processingQueue.enqueue(chunkingTask);
        processingQueue.enqueue(vectorizationTask);
        
        logger.info("文档处理任务已加入队列: docId={}", docFile.getId());
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

    @Override
    @Transactional
    public void updateDocumentInfo(Long docId, Long userId, String coverUrl, DocFile.Category category,
            String author, String fileName, String description) {
        logger.info("开始更新文档信息: docId={}, userId={}, category={}, author={}, fileName={}",
            docId, userId, category, author, fileName);
        
        // 检查文档存在且为激活状态
        DocFile docFile = docFileRepository.findByIdAndStatus(docId, DocFile.Status.ACTIVE)
                .orElseThrow(() -> {
                    logger.warn("文档不存在或已删除: docId={}", docId);
                    return new ResourceNotFoundException("Document not found or deleted");
                });

        // 验证用户权限
        KnowledgeBaseFile relation = knowledgeBaseFileRepository.findFirstByFileId(docId)
                .orElseThrow(() -> {
                    logger.warn("文档未关联到任何知识库: docId={}", docId);
                    return new ResourceNotFoundException("Document is not associated with any knowledge base");
                });

        if (!relation.getCreatedBy().equals(userId)) {
            logger.warn("用户无权限更新该文档: docId={}, userId={}", docId, userId);
            throw new IllegalArgumentException("No permission to update this document");
        }

        // 更新文档信息
        boolean updated = false;
        if (coverUrl != null) {
            docFile.setCoverUrl(coverUrl);
            updated = true;
        }
        if (category != null) {
            docFile.setCategory(category);
            updated = true;
        }
        if (author != null) {
            docFile.setAuthor(author);
            updated = true;
        }
        if (fileName != null) {
            docFile.setFileName(fileName);
            updated = true;
        }
        if (description != null) {
            docFile.setDescription(description);
            updated = true;
        }

        if (updated) {
            docFileRepository.save(docFile);
            logger.info("文档信息更新成功: docId={}", docId);
        } else {
            logger.info("没有需要更新的文档信息: docId={}", docId);
        }
    }

    @Override
    @Transactional
    public void updatePublishStatus(Long docId, Long userId, DocFile.PublishStatus status) {
        logger.info("开始更新文档发布状态: docId={}, userId={}, status={}", docId, userId, status);
        
        // 检查文档存在且为激活状态
        DocFile docFile = docFileRepository.findByIdAndStatus(docId, DocFile.Status.ACTIVE)
                .orElseThrow(() -> {
                    logger.warn("文档不存在或已删除: docId={}", docId);
                    return new ResourceNotFoundException("Document not found or deleted");
                });

        // 验证用户权限
        KnowledgeBaseFile relation = knowledgeBaseFileRepository.findFirstByFileId(docId)
                .orElseThrow(() -> {
                    logger.warn("文档未关联到任何知识库: docId={}", docId);
                    return new ResourceNotFoundException("Document is not associated with any knowledge base");
                });

        if (!relation.getCreatedBy().equals(userId)) {
            logger.warn("用户无权限更新该文档状态: docId={}, userId={}", docId, userId);
            throw new IllegalArgumentException("No permission to update this document status");
        }

        docFile.setPublishStatus(status);
        docFileRepository.save(docFile);
        logger.info("文档发布状态更新成功: docId={}, status={}", docId, status);
    }

    @Override
    @Transactional(readOnly = true)
    public DocFile getDocument(Long docId, Long userId) {
        logger.info("开始获取文档详情: docId={}, userId={}", docId, userId);
        
        // 检查文档存在且为激活状态
        DocFile docFile = docFileRepository.findByIdAndStatus(docId, DocFile.Status.ACTIVE)
                .orElseThrow(() -> {
                    logger.warn("文档不存在或已删除: docId={}", docId);
                    return new ResourceNotFoundException("Document not found or deleted");
                });

        // 验证用户权限：
        // 1. 如果文档已发布，所有用户都可以访问
        // 2. 如果文档未发布，只有关联知识库的创建者可以访问
        if (docFile.getPublishStatus() != DocFile.PublishStatus.PUBLISHED) {
            KnowledgeBaseFile relation = knowledgeBaseFileRepository.findFirstByFileId(docId)
                    .orElseThrow(() -> {
                        logger.warn("文档未关联到任何知识库: docId={}", docId);
                        return new ResourceNotFoundException("Document is not associated with any knowledge base");
                    });

            if (!relation.getCreatedBy().equals(userId)) {
                logger.warn("用户无权限访问该文档: docId={}, userId={}", docId, userId);
                throw new IllegalArgumentException("No permission to access this document");
            }
        }

        logger.info("获取文档详情成功: docId={}", docId);
        return docFile;
    }

    @Override
    @Transactional
    public void incrementLearnerCount(Long docId) {
        logger.info("开始增加文档学习人数: docId={}", docId);
        
        // 检查文档存在且为激活状态
        DocFile docFile = docFileRepository.findByIdAndStatus(docId, DocFile.Status.ACTIVE)
                .orElseThrow(() -> {
                    logger.warn("文档不存在或已删除: docId={}", docId);
                    return new ResourceNotFoundException("Document not found or deleted");
                });

        // 检查文档是否已发布
        if (docFile.getPublishStatus() != DocFile.PublishStatus.PUBLISHED) {
            logger.warn("文档未发布，无法增加学习人数: docId={}", docId);
            throw new IllegalArgumentException("Document is not published");
        }

        docFile.setLearnerCount(docFile.getLearnerCount() + 1);
        docFileRepository.save(docFile);
        logger.info("文档学习人数更新成功: docId={}, 当前学习人数={}", docId, docFile.getLearnerCount());
    }
}
