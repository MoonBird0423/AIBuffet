package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.model.User;
import com.aibuffet.service.PublishService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/publish")
@RequiredArgsConstructor
public class PublishController {
    
    private static final Logger logger = LoggerFactory.getLogger(PublishController.class);
    private final PublishService publishService;

    @GetMapping("/docs/{docId}/interpretation")
    public ApiResponse<String> getInterpretation(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("获取文档解读: docId={}, userId={}", docId, user.getId());
            String content = publishService.getInterpretation(docId, user.getId()).get();
            return ApiResponse.success(content);
        } catch (Exception e) {
            logger.error("获取文档解读失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @PostMapping("/docs/{docId}/interpretation/generate")
    public ApiResponse<Void> generateInterpretation(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("生成文档解读: docId={}, userId={}", docId, user.getId());
            publishService.generateInterpretation(docId, user.getId());
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("生成文档解读失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @GetMapping("/docs/{docId}/mindmap")
    public ApiResponse<String> getMindmap(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("获取思维导图: docId={}, userId={}", docId, user.getId());
            String content = publishService.getMindmap(docId, user.getId()).get();
            return ApiResponse.success(content);
        } catch (Exception e) {
            logger.error("获取思维导图失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @PostMapping("/docs/{docId}/mindmap/generate")
    public ApiResponse<Void> generateMindmap(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("生成思维导图: docId={}, userId={}", docId, user.getId());
            publishService.generateMindmap(docId, user.getId());
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("生成思维导图失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @GetMapping("/docs/{docId}/quiz")
    public ApiResponse<String> getQuiz(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("获取测试题: docId={}, userId={}", docId, user.getId());
            String content = publishService.getQuiz(docId, user.getId()).get();
            return ApiResponse.success(content);
        } catch (Exception e) {
            logger.error("获取测试题失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @PostMapping("/docs/{docId}/quiz/generate")
    public ApiResponse<Void> generateQuiz(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("生成测试题: docId={}, userId={}", docId, user.getId());
            publishService.generateQuiz(docId, user.getId());
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("生成测试题失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }
}
