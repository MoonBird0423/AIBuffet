package com.aibuffet.service;

import com.aibuffet.common.ResourceNotFoundException;
import com.aibuffet.controller.DocumentController;
import com.aibuffet.model.DocFile;
import com.aibuffet.model.DocFile.Status;
import com.aibuffet.model.KnowledgeBaseFile;
import com.aibuffet.dto.UploadResult;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.KnowledgeBaseFileRepository;
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
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentService {
    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    @Autowired
    private DocFileRepository docFileRepository;

    @Autowired
    private KnowledgeBaseFileRepository knowledgeBaseFileRepository;

    @Autowired
    private OSSService ossService;

    /**
     * 上传单个文件
     */
    @Transactional
    public UploadResult uploadSingleFile(MultipartFile file, Long knowledgeBaseId, Long userId, String uploadId, DocumentController controller) {
        try {
            logger.info("处理文件: name={}, size={}, type={}", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());

            // 验证文件格式
            if (!ossService.isValidKnowledgeDoc(file)) {
                logger.error("文件验证失败: {}", file.getOriginalFilename());
                return UploadResult.error(file.getOriginalFilename(), 
                    "Invalid document format: " + file.getContentType());
            }

            // 计算文件MD5
            String md5Hash = calculateMD5(file);
            logger.debug("文件MD5: {}", md5Hash);

            // 检查文件是否已存在
            DocFile existingFile = docFileRepository.findByMd5Hash(md5Hash);
            if (existingFile != null) {
                logger.info("文件已存在，直接关联到知识库: fileId={}", existingFile.getId());
                knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, existingFile.getId(), userId));
                return UploadResult.success(file.getOriginalFilename(), existingFile);
            }

            // 上传到OSS
            logger.info("开始上传文件到OSS: {}", file.getOriginalFilename());
            String fileUrl = ossService.uploadKnowledgeDoc(file, userId, uploadId, file.getOriginalFilename(), controller);
            logger.info("OSS上传完成，文件URL: {}", fileUrl);

            // 保存文件信息到数据库
            DocFile docFile = new DocFile();
            docFile.setFileName(file.getOriginalFilename());
            docFile.setFileType(getFileExtension(file.getOriginalFilename()));
            docFile.setFileSize(file.getSize());
            docFile.setFileUrl(fileUrl);
            docFile.setUploadedBy(userId);
            docFile.setMd5Hash(md5Hash);
            docFile = docFileRepository.save(docFile);
            logger.info("文件信息已保存: fileId={}", docFile.getId());

            // 关联文件到知识库
            knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, docFile.getId(), userId));
            logger.info("文件已关联到知识库: fileId={}, knowledgeBaseId={}", docFile.getId(), knowledgeBaseId);

            return UploadResult.success(file.getOriginalFilename(), docFile);

        } catch (Exception e) {
            logger.error("文件处理失败: {}, 错误: {}", file.getOriginalFilename(), e.getMessage(), e);
            return UploadResult.error(file.getOriginalFilename(), e.getMessage());
        }
    }

    /**
     * 批量上传文档并保存到知识库
     */
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

    /**
     * 从知识库中删除文档
     */
    @Autowired
    private EntityManager entityManager;

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
            logger.info("文档无其他引用，已标记为删除: docId={}", docId);
        } else {
            logger.info("文档仍有其他知识库引用({}个), 保持激活状态: docId={}", referenceCount, docId);
        }

        // 强制刷新并清除持久化上下文
        entityManager.flush();
        entityManager.clear();
    }

    /**
     * 获取知识库的文档列表（只返回激活状态的文档）
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Page<DocFile> getDocuments(Long knowledgeBaseId, int page, int size) {
        logger.info("开始查询文档列表: knowledgeBaseId={}, page={}, size={}", 
            knowledgeBaseId, page, size);
        Page<DocFile> result = docFileRepository.findByKbId(knowledgeBaseId, PageRequest.of(page, size));
        logger.info("文档列表查询完成: 总数={}, 总页数={}", 
            result.getTotalElements(), result.getTotalPages());
        return result;
    }

    public void verifyDocumentDeletable(Long docId, Long knowledgeBaseId, Long userId) {
        DocFile docFile = docFileRepository.findByIdAndStatus(docId, Status.ACTIVE)
                .orElseThrow(() -> {
                    logger.warn("文档不存在或已删除: docId={}", docId);
                    return new ResourceNotFoundException("Document not found or already deleted");
                });

        KnowledgeBaseFile relation = knowledgeBaseFileRepository.findByKbIdAndFileId(knowledgeBaseId, docId)
                .orElseThrow(() -> {
                    logger.warn("文档未关联到该知识库: docId={}, knowledgeBaseId={}", docId, knowledgeBaseId);
                    return new ResourceNotFoundException("Document is not associated with this knowledge base");
                });

        if (!relation.getCreatedBy().equals(userId)) {
            logger.warn("用户无权限删除该知识库的文档: docId={}, knowledgeBaseId={}, userId={}", 
                docId, knowledgeBaseId, userId);
            throw new IllegalArgumentException("No permission to delete this document from the knowledge base");
        }
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

    private String extractObjectNameFromUrl(String fileUrl) {
        int questionMarkIndex = fileUrl.indexOf('?');
        String urlWithoutParams = questionMarkIndex == -1 ? fileUrl : fileUrl.substring(0, questionMarkIndex);
        return urlWithoutParams.substring(urlWithoutParams.indexOf("/documents/"));
    }
}
