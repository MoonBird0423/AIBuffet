package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.model.User;
import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.model.KnowledgeBase;
import com.aibuffet.service.KnowledgeBaseService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge-bases")
public class KnowledgeBaseController {
    
    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseController.class);

    @Autowired
    private KnowledgeBaseService knowledgeBaseService;

    @PostMapping
    public ApiResponse<KnowledgeBase> createKnowledgeBase(
            @Valid @RequestBody CreateKnowledgeBaseRequest request,
            @AuthenticationPrincipal User user) {
        log.info("Creating knowledge base: request={}, userId={}", request, user.getId());
        try {
            KnowledgeBase knowledgeBase = knowledgeBaseService.createKnowledgeBase(request, user.getId());
            log.info("Knowledge base created successfully: id={}", knowledgeBase.getId());
            return ApiResponse.success(knowledgeBase);
        } catch (Exception e) {
            log.error("Failed to create knowledge base", e);
            return ApiResponse.error(500, "创建知识库失败: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ApiResponse<List<KnowledgeBase>> getMyKnowledgeBases(
            @AuthenticationPrincipal User user) {
        List<KnowledgeBase> knowledgeBases = knowledgeBaseService.getMyKnowledgeBases(user.getId());
        return ApiResponse.success(knowledgeBases);
    }

    @GetMapping("/public")
    public ApiResponse<List<KnowledgeBase>> getPublicKnowledgeBases() {
        List<KnowledgeBase> knowledgeBases = knowledgeBaseService.getPublicKnowledgeBases();
        return ApiResponse.success(knowledgeBases);
    }

    @GetMapping("/category/{category}")
    public ApiResponse<List<KnowledgeBase>> getKnowledgeBasesByCategory(
            @PathVariable String category) {
        List<KnowledgeBase> knowledgeBases = knowledgeBaseService.getKnowledgeBasesByCategory(category);
        return ApiResponse.success(knowledgeBases);
    }
}
