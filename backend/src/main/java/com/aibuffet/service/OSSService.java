package com.aibuffet.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import com.aibuffet.config.OSSConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.function.Consumer;
import java.io.IOException;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class OSSService {
    private static final Logger logger = LoggerFactory.getLogger(OSSService.class);
    
    // OSS存储目录结构常量
    private static final String AVATAR_DIR = "avatars";
    private static final String CHAT_IMAGE_DIR = "chat-images";
    private static final String KNOWLEDGE_DOC_DIR = "knowledgebase-doc";

    // 头像相关常量
    private static final long AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_AVATAR_TYPES = {
        "image/jpeg", "image/png", "image/webp"
    };

    // 聊天图片相关常量
    private static final long CHAT_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_CHAT_IMAGE_TYPES = {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    // 知识库文档相关常量
    private static final long KNOWLEDGE_DOC_MAX_SIZE = 300 * 1024 * 1024; // 300MB
    private static final String[] ALLOWED_DOC_TYPES = {
        // Office 文档
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",      // .xlsx
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "application/msword",         // .doc
        "application/vnd.ms-excel",   // .xls
        "application/vnd.ms-powerpoint", // .ppt
        // PDF 文档
        "application/pdf",            // .pdf
        // 纯文本
        "text/plain",                 // .txt
        "text/csv",                   // .csv
        "application/json",           // .json
        "text/xml",                   // .xml
        "text/html",                  // .html
        // 电子邮件
        "message/rfc822",            // .eml
        "application/vnd.ms-outlook", // .msg
        // 电子书
        "application/epub+zip",      // .epub
        "application/x-mobipocket-ebook" // .mobi
    };

    private static final Set<String> ALLOWED_DOC_EXTENSIONS = Set.of(
        ".docx", ".xlsx", ".pptx", ".doc", ".xls", ".ppt",
        ".pdf",
        ".txt", ".csv", ".json", ".xml", ".html",
        ".eml", ".msg",
        ".epub", ".mobi"
    );

    @Autowired
    private OSS ossClient;

    @Autowired
    private OSSConfig ossConfig;

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    /**
     * 生成OSS对象键
     */
    private String generateObjectKey(String baseDir, Long userId, String filename) {
        String extension = getFileExtension(filename);
        return String.format("%s/%d/%s%s", baseDir, userId, UUID.randomUUID(), extension);
    }

    /**
     * 上传文件到OSS并返回访问URL
     */
    private String uploadToOSS(MultipartFile file, String objectKey, Consumer<Integer> progressCallback) throws IOException {
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        PutObjectRequest putObjectRequest = new PutObjectRequest(
            ossConfig.getBucketName(),
            objectKey,
            file.getInputStream(),
            metadata
        );

        if (progressCallback != null) {
            putObjectRequest.withProgressListener(progressEvent -> {
                long bytes = progressEvent.getBytes();
                long totalBytes = file.getSize();
                int progress = (int) (bytes * 100 / totalBytes);
                progressCallback.accept(progress);
            });
        }

        ossClient.putObject(putObjectRequest);

        Date expiration = Date.from(
            LocalDateTime.now().plusYears(10)
                .atZone(ZoneId.systemDefault())
                .toInstant()
        );
        URL url = ossClient.generatePresignedUrl(
            ossConfig.getBucketName(),
            objectKey,
            expiration
        );

        return url.toString();
    }

    /**
     * 验证文件的基本属性
     */
    private boolean validateFile(MultipartFile file, String[] allowedTypes, long maxSize) {
        if (file == null || file.isEmpty()) {
            logger.error("文件为空或无效");
            return false;
        }

        String contentType = file.getContentType();
        long size = file.getSize();

        boolean isValidType = contentType != null && Arrays.asList(allowedTypes).contains(contentType);
        boolean isValidSize = size <= maxSize;

        if (!isValidType) {
            logger.error("不支持的文件类型: {}", contentType);
        }
        if (!isValidSize) {
            logger.error("文件大小超出限制: {} > {}", size, maxSize);
        }

        return isValidType && isValidSize;
    }

    /**
     * 上传头像
     */
    public String uploadAvatar(MultipartFile file, Long userId) throws IOException {
        logger.info("开始处理头像上传: 用户ID={}, 文件名={}, 文件大小={}, 文件类型={}", 
            userId, file.getOriginalFilename(), file.getSize(), file.getContentType());

        if (!validateFile(file, ALLOWED_AVATAR_TYPES, AVATAR_MAX_SIZE)) {
            throw new IllegalArgumentException("Invalid avatar file");
        }

        String objectKey = generateObjectKey(AVATAR_DIR, userId, file.getOriginalFilename());

        try {
            String url = uploadToOSS(file, objectKey, null);
            logger.info("头像上传成功: {}", url);
            return url;
        } catch (Exception e) {
            logger.error("头像上传失败: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 上传聊天图片
     */
    public String uploadChatImage(MultipartFile file, Long userId) throws IOException {
        logger.info("开始处理聊天图片上传: 用户ID={}, 文件名={}, 文件大小={}, 文件类型={}", 
            userId, file.getOriginalFilename(), file.getSize(), file.getContentType());

        if (!validateFile(file, ALLOWED_CHAT_IMAGE_TYPES, CHAT_IMAGE_MAX_SIZE)) {
            throw new IllegalArgumentException("Invalid chat image file");
        }

        String objectKey = generateObjectKey(CHAT_IMAGE_DIR, userId, file.getOriginalFilename());

        try {
            String url = uploadToOSS(file, objectKey, null);
            logger.info("聊天图片上传成功: {}", url);
            return url;
        } catch (Exception e) {
            logger.error("聊天图片上传失败: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 上传知识库文档
     */
    public String uploadKnowledgeDoc(MultipartFile file, Long userId, Consumer<Integer> progressCallback) throws IOException {
        logger.info("开始处理知识库文档上传: 用户ID={}, 文件名={}, 文件大小={}, 文件类型={}", 
            userId, file.getOriginalFilename(), file.getSize(), file.getContentType());

        String extension = getFileExtension(file.getOriginalFilename());
        if (!validateFile(file, ALLOWED_DOC_TYPES, KNOWLEDGE_DOC_MAX_SIZE) || 
            !ALLOWED_DOC_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Invalid document file");
        }

        String objectKey = generateObjectKey(KNOWLEDGE_DOC_DIR, userId, file.getOriginalFilename());

        try {
            String url = uploadToOSS(file, objectKey, progressCallback);
            logger.info("知识库文档上传成功: {}", url);
            return url;
        } catch (Exception e) {
            logger.error("知识库文档上传失败: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 删除OSS中的文件
     */
    public void deleteFile(String objectName) {
        try {
            ossClient.deleteObject(ossConfig.getBucketName(), objectName);
            logger.info("成功删除OSS文件: {}", objectName);
        } catch (Exception e) {
            logger.error("删除OSS文件失败: {}, 错误: {}", objectName, e.getMessage());
            throw new RuntimeException("Failed to delete file from OSS", e);
        }
    }

    // 验证方法供外部使用
    public boolean isValidChatImage(MultipartFile file) {
        return validateFile(file, ALLOWED_CHAT_IMAGE_TYPES, CHAT_IMAGE_MAX_SIZE);
    }

    public boolean isValidAvatarImage(MultipartFile file) {
        return validateFile(file, ALLOWED_AVATAR_TYPES, AVATAR_MAX_SIZE);
    }

    public boolean isValidKnowledgeDoc(MultipartFile file) {
        String extension = getFileExtension(file.getOriginalFilename());
        return validateFile(file, ALLOWED_DOC_TYPES, KNOWLEDGE_DOC_MAX_SIZE) && 
               ALLOWED_DOC_EXTENSIONS.contains(extension);
    }
}
