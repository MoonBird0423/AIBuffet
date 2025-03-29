package com.aibuffet.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import com.aibuffet.config.OSSConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

@Service
public class OSSService {

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

        // 生成签名URL，有效期24小时
        Date expiration = Date.from(
                LocalDateTime.now().plusHours(24)
                        .atZone(ZoneId.systemDefault())
                        .toInstant()
        );
        URL url = ossClient.generatePresignedUrl(ossConfig.getBucketName(), fileName, expiration);

        return url.toString();
    }

    /**
     * 检查文件是否合法
     * @param file 文件
     * @return 是否合法
     */
    public boolean isValidFile(MultipartFile file) {
        String contentType = file.getContentType();
        long size = file.getSize();
        
        // 检查文件类型
        if (contentType == null || !contentType.startsWith("image/")) {
            return false;
        }

        // 检查文件大小（最大2MB）
        return size <= 2 * 1024 * 1024;
    }
}