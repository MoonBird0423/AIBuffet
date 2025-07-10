package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.BenefitCheck;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.common.ResourceNotFoundException;
import com.aibuffet.model.DocFile;
import com.aibuffet.dto.DocFileSummary;
import com.aibuffet.model.DocChunk;
import com.aibuffet.dto.UploadResult;
import com.aibuffet.service.DocumentService;
import com.aibuffet.service.OSSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.aibuffet.model.User;
import org.springframework.http.ResponseEntity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);
    
    private static final long MAX_COVER_SIZE = 2 * 1024 * 1024; // 2MB
    
    @Autowired
    private DocumentService documentService;

    @Autowired
    private OSSService ossService;

    @Autowired
    private EntityManager entityManager;

    // 存储每个上传ID下各文件的进度
    private final Map<String, Map<String, Integer>> uploadProgress = new ConcurrentHashMap<>();
    private final Map<String, List<UploadResult>> uploadResults = new ConcurrentHashMap<>();

    // 更新文件上传进度
    public void updateProgress(String uploadId, String fileName, int progress) {
        uploadProgress.computeIfPresent(uploadId, (id, progressMap) -> {
            progressMap.put(fileName, progress);
            return progressMap;
        });
    }

    @BenefitCheck("api:document:upload")
    @PostMapping("/upload")
    public ApiResponse<Map<String, Object>> uploadDocuments(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("knowledgeBaseId") Long knowledgeBaseId,
            @AuthenticationPrincipal User user) {
        try {
            String uploadId = String.format("%d_%d", knowledgeBaseId, System.currentTimeMillis());
            uploadProgress.put(uploadId, new ConcurrentHashMap<>());
            // 初始化每个文件的进度
            for (MultipartFile file : files) {
                uploadProgress.get(uploadId).put(file.getOriginalFilename(), 0);
            }

            // 异步处理文件上传
            CompletableFuture<List<UploadResult>> uploadFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    List<UploadResult> results = documentService.uploadDocuments(
                        files,
                        knowledgeBaseId,
                        user.getId(),
                        uploadId,
                        this
                    );
                    if (results != null && !results.isEmpty()) {
                        uploadResults.put(uploadId, results);

                        // 设置所有成功文件的进度为100%
                        Map<String, Integer> finalProgress = uploadProgress.get(uploadId);
                        if (finalProgress != null) {
                            results.stream()
                                .filter(r -> r.getFile() != null)
                                .forEach(r -> finalProgress.put(r.getFileName(), 100));
                        }
                    } else {
                        logger.error("文件上传失败: 未返回处理结果");
                        uploadProgress.remove(uploadId);
                        throw new RuntimeException("File upload failed: No results");
                    }
                    return results;
                } catch (Exception e) {
                    logger.error("文件上传失败: uploadId={}, error={}", uploadId, e.getMessage(), e);
                    // 出错时移除进度记录
                    uploadProgress.remove(uploadId);
                    throw new CompletionException(e);
                }
            });

            // 添加超时处理
            try {
                uploadFuture.get(5, TimeUnit.MINUTES);
            } catch (InterruptedException | ExecutionException | TimeoutException e) {
                logger.error("文件上传超时或失败: uploadId={}, error={}", uploadId, e.getMessage(), e);
                uploadProgress.remove(uploadId);
                return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "文件上传失败: " + e.getMessage());
            }

            // 返回uploadId和上传结果
            Map<String, Object> response = new HashMap<>();
            response.put("uploadId", uploadId);
            response.put("results", uploadResults.get(uploadId));
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("文件上传请求处理失败: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, e.getMessage());
        }
    }

    @GetMapping("/progress/{uploadId}")
    public ApiResponse<Map<String, Object>> getUploadProgress(@PathVariable String uploadId) {
        Map<String, Integer> progress = uploadProgress.getOrDefault(uploadId, new ConcurrentHashMap<>());
        Map<String, Object> response = new HashMap<>();
        response.put("progress", progress);
        
        // 检查是否所有文件都完成了
        boolean allCompleted = !progress.isEmpty() && progress.values().stream().allMatch(p -> p >= 100);
        response.put("completed", allCompleted);
        
        if (allCompleted) {
            // 获取上传结果
            List<UploadResult> results = uploadResults.remove(uploadId);
            if (results != null) {
                logger.info("所有文件上传完成: uploadId={}, 文件数={}", uploadId, results.size());
                response.put("results", results);
            } else {
                logger.warn("未找到上传结果: uploadId={}", uploadId);
                response.put("error", "No upload results found");
            }
            // 清理进度记录
            uploadProgress.remove(uploadId);
        }
        
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<Page<DocFileSummary>> getDocuments(
            @RequestParam(required = false) Long knowledgeBaseId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) DocFile.Category category,
            @RequestParam(required = false) String relationType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal(errorOnInvalidType = false) User user) {
        try {
            long startTime = System.currentTimeMillis();
            Long userId = user != null ? user.getId() : null;
            logger.info("DocumentController: 接收到查询请求: knowledgeBaseId={}, keyword={}, category={}, relationType={}, page={}, size={}, userId={}", 
                knowledgeBaseId, keyword, category, relationType, page, size, userId);
            Page<DocFileSummary> documents = documentService.getDocuments(knowledgeBaseId, keyword, category, relationType, page, size, userId);
            long duration = System.currentTimeMillis() - startTime;
            logger.info("DocumentController: 查询完成，返回结果数量: {}, 耗时: {}ms", documents.getContent().size(), duration);
            
            ApiResponse<Page<DocFileSummary>> response = ApiResponse.success(documents);
            response.setServerProcessTime(duration);
            return response;
        } catch (Exception e) {
            logger.error("获取文档列表失败: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDocument(
            @PathVariable Long id,
            @RequestParam Long knowledgeBaseId,
            @AuthenticationPrincipal User user) {
        try {
            // 执行删除操作
            documentService.deleteDocument(id, knowledgeBaseId, user.getId());
            
            return ApiResponse.success(null);
        } catch (ResourceNotFoundException e) {
            logger.warn("删除文档失败，文档不存在: docId={}, userId={}", id, user.getId());
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("删除文档失败，无权限: docId={}, userId={}", id, user.getId());
            return ApiResponse.error(ErrorCode.PERMISSION_DENIED, e.getMessage());
        } catch (Exception e) {
            logger.error("删除文档失败，系统错误: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "系统错误，请稍后重试");
        }
    }

    @PostMapping("/{id}/retry")
    public ApiResponse<Void> retryProcessing(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            documentService.retryProcessing(id, user.getId());
            return ApiResponse.success(null);
        } catch (ResourceNotFoundException e) {
            logger.warn("重试文档处理失败，文档不存在: docId={}, userId={}", id, user.getId());
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("重试文档处理失败，无权限: docId={}, userId={}", id, user.getId());
            return ApiResponse.error(ErrorCode.PERMISSION_DENIED, e.getMessage());
        } catch (Exception e) {
            logger.error("重试文档处理失败，系统错误: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "系统错误，请稍后重试");
        }
    }    @GetMapping("/{id}/chunks")
    public ApiResponse<Map<String, Object>> getDocumentChunks(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User user) {
        try {
            Map<String, Object> result = documentService.getDocumentChunks(id, user.getId(), page, size);
            return ApiResponse.success(result);
        } catch (ResourceNotFoundException e) {
            logger.warn("获取文档分块失败，文档不存在: docId={}, userId={}, page={}, size={}", id, user.getId(), page, size);
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("获取文档分块失败，无权限: docId={}, userId={}, page={}, size={}", id, user.getId(), page, size);
            return ApiResponse.error(ErrorCode.PERMISSION_DENIED, e.getMessage());
        } catch (Exception e) {
            logger.error("获取文档分块失败，系统错误: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "系统错误，请稍后重试");
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateDocument(
            @PathVariable Long id,
            @RequestParam(required = false) MultipartFile cover,
            @RequestParam(required = false) DocFile.Category category,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String fileName,
            @RequestParam(required = false) String description,
            @AuthenticationPrincipal User user) {
        try {
            String coverUrl = null;
            if (cover != null) {
                if (cover.getSize() > MAX_COVER_SIZE) {
                    return ApiResponse.error(ErrorCode.INVALID_REQUEST, "封面图片大小不能超过2MB");
                }
                coverUrl = ossService.uploadBookCover(cover, user.getId());
            }
            
            documentService.updateDocumentInfo(id, user.getId(), coverUrl, category, author, fileName, description);
            return ApiResponse.success(null);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            logger.error("更新文档信息失败: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "系统错误，请稍后重试");
        }
    }

    @PutMapping("/{id}/publish-status")
    public ApiResponse<Void> updatePublishStatus(
            @PathVariable Long id,
            @RequestParam DocFile.PublishStatus status,
            @AuthenticationPrincipal User user) {
        try {
            documentService.updatePublishStatus(id, user.getId(), status);
            return ApiResponse.success(null);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            logger.error("更新发布状态失败: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "系统错误，请稍后重试");
        }
    }

    @PostMapping("/{id}/favorite")
    public ApiResponse<Void> favoriteDocument(
            @PathVariable Long id,
            @RequestParam Long knowledgeBaseId,
            @AuthenticationPrincipal User user) {
        try {
            documentService.favoriteDocument(id, knowledgeBaseId, user.getId());
            return ApiResponse.success(null);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (IllegalStateException e) {
            // 处理已存在的情况
            return ApiResponse.error(ErrorCode.INVALID_REQUEST, "图书已经存在于知识库中");
        } catch (Exception e) {
            logger.error("收藏文档失败: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "收藏失败，请稍后重试");
        }
    }

    @DeleteMapping("/{id}/favorite")
    public ApiResponse<Void> unfavoriteDocument(
            @PathVariable Long id,
            @RequestParam Long knowledgeBaseId,
            @AuthenticationPrincipal User user) {
        try {
            documentService.unfavoriteDocument(id, knowledgeBaseId, user.getId());
            return ApiResponse.success(null);
        } catch (ResourceNotFoundException e) {
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(ErrorCode.PERMISSION_DENIED, e.getMessage());
        } catch (Exception e) {
            logger.error("取消收藏失败: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "取消收藏失败，请稍后重试");
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<DocFile> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal(errorOnInvalidType = false) User user) {
        try {
            Long userId = user != null ? user.getId() : null;
            logger.info("获取文档详情请求: docId={}, userId={}", id, userId);
            DocFile document = documentService.getDocument(id, userId);
            logger.info("获取文档详情成功: docId={}", id);
            return ApiResponse.success(document);
        } catch (ResourceNotFoundException e) {
            logger.warn("获取文档详情失败，文档不存在: docId={}, userId={}", id, user != null ? user.getId() : null);
            return ApiResponse.error(ErrorCode.RESOURCE_NOT_FOUND, e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("获取文档详情失败，无权限: docId={}, userId={}", id, user != null ? user.getId() : null);
            return ApiResponse.error(ErrorCode.PERMISSION_DENIED, e.getMessage());
        } catch (Exception e) {
            logger.error("获取文档详情失败，系统错误: ", e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, "系统错误，请稍后重试");
        }
    }

}
