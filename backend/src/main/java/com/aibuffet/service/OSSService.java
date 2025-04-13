package com.aibuffet.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import com.aibuffet.config.OSSConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;

import java.io.IOException;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

@Service
public class OSSService {
    // 聊天图片相关常量
    private static final long CHAT_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_IMAGE_TYPES = {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    @Autowired
    private OSS ossClient;

    @Autowired
    private OSSConfig ossConfig;

    /**
     * 上传文件到OSS并返回访问URL
     * @param file 文件
     * @param userId 用户ID
     * @return 文件访问URL
     */
    public String uploadFile(MultipartFile file, Long userId) throws IOException {
        // 生成唯一的文件名
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String fileName = String.format("avatars/%d/%s%s", userId, UUID.randomUUID().toString(), extension);

        // 设置文件元数据
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        // 上传文件
        PutObjectRequest putObjectRequest = new PutObjectRequest(
                ossConfig.getBucketName(),
                fileName,
                file.getInputStream(),
                metadata
        );
        PutObjectResult result = ossClient.putObject(putObjectRequest);

        // 生成签名URL，有效期10年
        Date expiration = Date.from(
                LocalDateTime.now().plusYears(10)
                        .atZone(ZoneId.systemDefault())
                        .toInstant()
        );
        URL url = ossClient.generatePresignedUrl(ossConfig.getBucketName(), fileName, expiration);

        return url.toString();
    }

    /**
     * 上传聊天图片到OSS并返回访问URL
     * @param file 图片文件
     * @param userId 用户ID
     * @return 图片访问URL
     */
    public String uploadChatImage(MultipartFile file, Long userId) throws IOException {
        // 验证聊天图片
        if (!isValidChatImage(file)) {
            throw new IllegalArgumentException("Invalid chat image file");
        }

        // 生成唯一的文件名
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String fileName = String.format("chat-images/%d/%s%s", userId, UUID.randomUUID().toString(), extension);

        // 设置文件元数据
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        // 上传文件
        PutObjectRequest putObjectRequest = new PutObjectRequest(
            ossConfig.getBucketName(),
            fileName,
            file.getInputStream(),
            metadata
        );
        ossClient.putObject(putObjectRequest);

        // 生成签名URL，有效期10年
        Date expiration = Date.from(
            LocalDateTime.now().plusYears(10)
                .atZone(ZoneId.systemDefault())
                .toInstant()
        );
        URL url = ossClient.generatePresignedUrl(
            ossConfig.getBucketName(), 
            fileName, 
            expiration
        );

        return url.toString();
    }

    /**
     * 验证聊天图片是否合法
     * @param file 图片文件
     * @return 是否合法
     */
    public boolean isValidChatImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        long size = file.getSize();

        return contentType != null 
            && Arrays.asList(ALLOWED_IMAGE_TYPES).contains(contentType)
            && size <= CHAT_IMAGE_MAX_SIZE;
    }
}
