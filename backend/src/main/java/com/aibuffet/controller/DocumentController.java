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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    
    @Autowired
    private DocumentService documentService;

    // 存储上传进度
    private final Map<String, Integer> uploadProgress = new ConcurrentHashMap<>();

    @PostMapping("/upload")
    public ApiResponse<Map<String, Object>> uploadDocuments(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("knowledgeBaseId") Long knowledgeBaseId,
            @AuthenticationPrincipal User user) {
        try {
            String uploadId = String.format("%d_%d", knowledgeBaseId, System.currentTimeMillis());
            uploadProgress.put(uploadId, 0);

            List<DocFile> savedFiles = documentService.uploadDocuments(
                files,
                knowledgeBaseId,
                user.getId(),
                progress -> uploadProgress.put(uploadId, Math.toIntExact(progress))
            );

            Map<String, Object> response = new HashMap<>();
            response.put("uploadId", uploadId);
            response.put("files", savedFiles);
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR, e.getMessage());
        }
    }

    @GetMapping("/progress/{uploadId}")
    public ApiResponse<Integer> getUploadProgress(@PathVariable String uploadId) {
        Integer progress = uploadProgress.getOrDefault(uploadId, 100);
        if (progress == 100) {
            uploadProgress.remove(uploadId);
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
