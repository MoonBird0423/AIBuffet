package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.model.DocFile;
import com.aibuffet.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.aibuffet.model.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.function.BiConsumer;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);
    
    @Autowired
    private DocumentService documentService;

    // 存储每个上传ID下各文件的进度
    private final Map<String, Map<String, Integer>> uploadProgress = new ConcurrentHashMap<>();
    private final Map<String, List<DocFile>> uploadResults = new ConcurrentHashMap<>();

    @PostMapping("/upload")
    public ApiResponse<Map<String, Object>> uploadDocuments(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("knowledgeBaseId") Long knowledgeBaseId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("收到文件上传请求: 文件数={}, 知识库ID={}, 用户ID={}", 
                files.length, knowledgeBaseId, user.getId());
            
            for (MultipartFile file : files) {
                logger.info("文件详情: name={}, size={}, type={}", 
                    file.getOriginalFilename(), file.getSize(), file.getContentType());
            }

            String uploadId = String.format("%d_%d", knowledgeBaseId, System.currentTimeMillis());
            uploadProgress.put(uploadId, new ConcurrentHashMap<>());
            // 初始化每个文件的进度
            for (MultipartFile file : files) {
                uploadProgress.get(uploadId).put(file.getOriginalFilename(), 0);
            }
            logger.info("生成上传ID: {}", uploadId);

            // 创建进度回调
            BiConsumer<String, Integer> progressCallback = (fileName, progress) -> {
                if (uploadProgress.containsKey(uploadId)) {
                    uploadProgress.get(uploadId).put(fileName, progress);
                    logger.debug("更新上传进度: uploadId={}, file={}, progress={}%", 
                        uploadId, fileName, progress);
                }
            };

            // 异步处理文件上传
            CompletableFuture.runAsync(() -> {
                try {
                    List<DocFile> savedFiles = documentService.uploadDocuments(
                        files,
                        knowledgeBaseId,
                        user.getId(),
                        progressCallback
                    );
                    uploadResults.put(uploadId, savedFiles);
                    logger.info("文件上传处理完成: uploadId={}, 保存的文件数={}", uploadId, savedFiles.size());

                    // 设置所有文件的进度为100%
                    Map<String, Integer> finalProgress = uploadProgress.get(uploadId);
                    if (finalProgress != null) {
                        for (String fileName : finalProgress.keySet()) {
                            finalProgress.put(fileName, 100);
                        }
                    }
                } catch (Exception e) {
                    logger.error("文件上传失败: uploadId={}", uploadId, e);
                    // 出错时移除进度记录
                    uploadProgress.remove(uploadId);
                }
            });

            // 立即返回uploadId
            Map<String, Object> response = new HashMap<>();
            response.put("uploadId", uploadId);
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("文件上传请求处理失败: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, e.getMessage());
        }
    }

    @GetMapping("/progress/{uploadId}")
    public ApiResponse<Map<String, Integer>> getUploadProgress(@PathVariable String uploadId) {
        Map<String, Integer> progress = uploadProgress.getOrDefault(uploadId, new ConcurrentHashMap<>());
        
        // 检查是否所有文件都完成了
        boolean allCompleted = progress.values().stream().allMatch(p -> p >= 100);
        if (allCompleted) {
            // 获取上传结果
            List<DocFile> savedFiles = uploadResults.remove(uploadId);
            if (savedFiles != null) {
                logger.info("所有文件上传完成: uploadId={}, 文件数={}", uploadId, savedFiles.size());
            }
            // 清理进度记录
            uploadProgress.remove(uploadId);
            logger.info("清理进度记录: uploadId={}", uploadId);
        }
        
        return ApiResponse.success(progress);
    }

    @GetMapping
    public ApiResponse<Page<DocFile>> getDocuments(
            @RequestParam Long knowledgeBaseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<DocFile> documents = documentService.getDocuments(knowledgeBaseId, page, size);
            return ApiResponse.success(documents);
        } catch (Exception e) {
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            documentService.deleteDocument(id, user.getId());
            return ApiResponse.success(null);
        } catch (Exception e) {
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, e.getMessage());
        }
    }
}
