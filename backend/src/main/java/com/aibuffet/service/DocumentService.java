package com.aibuffet.service;

import com.aibuffet.model.DocFile;
import com.aibuffet.model.KnowledgeBaseFile;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.KnowledgeBaseFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

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
     * 上传文档并保存到知识库
     */
    @Transactional
    public List<DocFile> uploadDocuments(MultipartFile[] files, Long knowledgeBaseId, Long userId, BiConsumer<String, Integer> progressCallback) throws IOException {
        List<DocFile> savedFiles = new ArrayList<>();
        logger.info("开始处理文件上传: 文件数={}, 知识库ID={}, 用户ID={}", files.length, knowledgeBaseId, userId);

        for (MultipartFile file : files) {
            logger.info("处理文件: name={}, size={}, type={}", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());

            logger.debug("验证文件格式");
            if (!ossService.isValidKnowledgeDoc(file)) {
                logger.error("文件验证失败: {}", file.getOriginalFilename());
                throw new IllegalArgumentException("Invalid document: " + file.getOriginalFilename());
            }

            logger.debug("计算文件MD5");
            String md5Hash = calculateMD5(file);
            logger.debug("文件MD5: {}", md5Hash);

            DocFile existingFile = docFileRepository.findByMd5Hash(md5Hash);
            if (existingFile != null) {
                logger.info("文件已存在，直接关联到知识库: fileId={}", existingFile.getId());
                knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, existingFile.getId(), userId));
                savedFiles.add(existingFile);
                continue;
            }

            logger.info("开始上传文件到OSS: {}", file.getOriginalFilename());
            String fileUrl = ossService.uploadKnowledgeDoc(file, userId, progress -> {
                if (progressCallback != null) {
                    logger.debug("上传进度: file={}, progress={}%", 
                        file.getOriginalFilename(), progress);
                    progressCallback.accept(file.getOriginalFilename(), progress);
                }
            });
            logger.info("OSS上传完成，文件URL: {}", fileUrl);

            logger.debug("保存文件信息到数据库");
            DocFile docFile = new DocFile();
            docFile.setFileName(file.getOriginalFilename());
            docFile.setFileType(getFileExtension(file.getOriginalFilename()));
            docFile.setFileSize(file.getSize());
            docFile.setFileUrl(fileUrl);
            docFile.setUploadedBy(userId);
            docFile.setMd5Hash(md5Hash);
            docFile = docFileRepository.save(docFile);
            logger.info("文件信息已保存: fileId={}", docFile.getId());

            logger.debug("关联文件到知识库");
            knowledgeBaseFileRepository.save(new KnowledgeBaseFile(knowledgeBaseId, docFile.getId(), userId));
            logger.info("文件已关联到知识库: fileId={}, knowledgeBaseId={}", docFile.getId(), knowledgeBaseId);
            savedFiles.add(docFile);
        }

        logger.info("文件上传处理完成，共处理{}个文件", savedFiles.size());
        return savedFiles;
    }

    /**
     * 删除文档
     */
    @Transactional
    public void deleteDocument(Long docId, Long userId) {
        DocFile docFile = docFileRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!docFile.getUploadedBy().equals(userId)) {
            throw new IllegalArgumentException("No permission to delete this document");
        }

        // 从OSS删除文件
        String objectName = extractObjectNameFromUrl(docFile.getFileUrl());
        ossService.deleteFile(objectName);

        // 删除数据库记录
        knowledgeBaseFileRepository.deleteByFileId(docId);
        docFileRepository.deleteById(docId);
    }

    /**
     * 获取知识库的文档列表
     */
    public Page<DocFile> getDocuments(Long knowledgeBaseId, int page, int size) {
        return docFileRepository.findByKnowledgeBaseId(knowledgeBaseId, PageRequest.of(page, size));
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
