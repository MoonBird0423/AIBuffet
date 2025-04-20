package com.aibuffet.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import com.aibuffet.config.OSSConfig;
import com.aibuffet.controller.DocumentController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.io.IOException;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.function.Consumer;

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
    private static final long KNOWLEDGE_DOC_MAX_SIZE = 1024 * 1024 * 1024; // 1GB
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
        "application/epub",          // .epub
        "application/x-mobipocket-ebook", // .mobi
        "application/mobi",         // .mobi
        "application/x-mobipocket", // .mobi
        "application/octet-stream"  // 通用二进制类型，某些浏览器可能使用
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
        // 生成一个唯一的OSS文件名，但保留原始扩展名
        String extension = getFileExtension(filename);
        String ossFileName = UUID.randomUUID().toString() + extension;
        logger.info("生成OSS文件名: 原始文件名={}, OSS文件名={}, 存储目录={}", 
            filename, ossFileName, baseDir);
        return String.format("%s/%d/%s", baseDir, userId, ossFileName);
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
        try {
            logger.info("开始验证文件: name={}, size={}, type={}", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());

            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("文件为空或大小为0");
            }

            String contentType = file.getContentType();
            long size = file.getSize();

            // 检查文件内容
            try {
                byte[] content = file.getBytes();
                if (content == null || content.length == 0) {
                    throw new IllegalArgumentException("文件内容为空");
                }
                logger.info("文件内容验证成功，大小: {} bytes", content.length);
            } catch (IOException e) {
                throw new IllegalArgumentException("读取文件内容失败: " + e.getMessage());
            }

            boolean isValidType = contentType != null && Arrays.asList(allowedTypes).contains(contentType);
            if (!isValidType) {
                throw new IllegalArgumentException(String.format(
                    "不支持的文件类型: %s，支持的类型: %s", 
                    contentType, 
                    Arrays.toString(allowedTypes)
                ));
            }

            boolean isValidSize = size <= maxSize;
            if (!isValidSize) {
                throw new IllegalArgumentException(String.format(
                    "文件大小超出限制: %.2fMB > %.2fGB", 
                    size / (1024.0 * 1024.0),
                    maxSize / (1024.0 * 1024.0 * 1024.0)
                ));
            }

            logger.info("文件验证通过: type={}, size={}", contentType, size);
            return true;
        } catch (Exception e) {
            logger.error("文件验证过程发生异常: {}", e.getMessage(), e);
            return false;
        }
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

    public String uploadKnowledgeDoc(MultipartFile file, Long userId, String uploadId, String fileName, DocumentController controller) throws IOException {
        String originalFileName = file.getOriginalFilename();
        logger.info("准备上传文件到OSS: 原始文件名={}, 文件大小={}, 文件类型={}, 用户ID={}, uploadId={}", 
            originalFileName, file.getSize(), file.getContentType(), userId, uploadId);

        String extension = getFileExtension(originalFileName);
        if (!validateFile(file, ALLOWED_DOC_TYPES, KNOWLEDGE_DOC_MAX_SIZE) || 
            !ALLOWED_DOC_EXTENSIONS.contains(extension)) {
            String error = String.format("文件验证失败[%s]: 类型=%s, 大小=%d, 扩展名=%s", 
                originalFileName,
                file.getContentType(), 
                file.getSize(), 
                extension);
            logger.error(error);
            throw new IllegalArgumentException(error);
        }

        String objectKey = generateObjectKey(KNOWLEDGE_DOC_DIR, userId, originalFileName);
        logger.debug("开始OSS上传: 原始文件名={}, objectKey={}", originalFileName, objectKey);

        try {
            String url = uploadToOSS(file, objectKey, progress -> controller.updateProgress(uploadId, fileName, progress));
            logger.info("OSS上传完成: 原始文件名={}, objectKey={}, URL={}", 
                originalFileName, objectKey, url);
            return url;
        } catch (Exception e) {
            logger.error("OSS上传失败: 原始文件名={}, objectKey={}, 错误={}", 
                originalFileName, objectKey, e.getMessage(), e);
            throw new IOException(String.format("文件上传失败: %s", e.getMessage()), e);
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
