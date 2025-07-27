package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.BenefitCheck;
import com.aibuffet.common.BenefitUsage;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.dto.InterpretationResponse;
import com.aibuffet.dto.MindmapResponse;
import com.aibuffet.dto.QuizResponse;
import com.aibuffet.model.DocInterpretation;
import com.aibuffet.model.DocMindmap;
import com.aibuffet.model.DocQuiz;
import com.aibuffet.model.User;
import com.aibuffet.service.PublishService;
import com.aibuffet.service.impl.PublishServiceImpl;
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
    public ApiResponse<InterpretationResponse> getInterpretation(
            @PathVariable Long docId,
            @AuthenticationPrincipal(errorOnInvalidType = false) User user) {
        try {
            Long userId = user != null ? user.getId() : null;
            logger.info("获取文档解读: docId={}, userId={}", docId, userId);
            
            // 获取带状态的解读信息
            DocInterpretation interpretation = ((PublishServiceImpl) publishService).getInterpretationWithStatus(docId, userId).get();
            
            if (interpretation == null) {
                return ApiResponse.success(null);
            }
            
            InterpretationResponse response = new InterpretationResponse(
                interpretation.getContent(),
                interpretation.getInterpretationStatus(),
                interpretation.getAudioUrl(),
                interpretation.getAudioStatus()
            );
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("获取文档解读失败: docId={}, userId={}, error={}", 
                docId, user != null ? user.getId() : null, e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @BenefitCheck("api:publish:generateInterpretation")
    @BenefitUsage(identifier = "api:publish:generateInterpretation", amount = 1)
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
    public ApiResponse<MindmapResponse> getMindmap(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("获取思维导图: docId={}, userId={}", docId, user.getId());
            
            // 获取带状态的脑图信息
            DocMindmap mindmap = ((PublishServiceImpl) publishService).getMindmapWithStatus(docId, user.getId()).get();
            
            if (mindmap == null) {
                return ApiResponse.success(null);
            }
            
            MindmapResponse response = new MindmapResponse(
                mindmap.getContent(),
                mindmap.getGenerationStatus()
            );
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("获取思维导图失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @BenefitCheck("api:publish:generateMindmap")
    @BenefitUsage(identifier = "api:publish:generateMindmap", amount = 1)
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
    public ApiResponse<QuizResponse> getQuiz(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("获取测试题: docId={}, userId={}", docId, user.getId());
            
            // 获取带状态的测试题信息
            DocQuiz quiz = ((PublishServiceImpl) publishService).getQuizWithStatus(docId, user.getId()).get();
            
            if (quiz == null) {
                return ApiResponse.success(null);
            }
            
            QuizResponse response = new QuizResponse(
                quiz.getQuestions(),
                quiz.getGenerationStatus()
            );
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("获取测试题失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @BenefitCheck("api:publish:generateQuiz")
    @BenefitUsage(identifier = "api:publish:generateQuiz", amount = 1)
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

    @PutMapping("/docs/{docId}/interpretation")
    public ApiResponse<Void> updateInterpretation(
            @PathVariable Long docId,
            @RequestBody String content,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("更新文档解读: docId={}, userId={}", docId, user.getId());
            publishService.updateInterpretation(docId, content, user.getId()).get();
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("更新文档解读失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @PutMapping("/docs/{docId}/mindmap")
    public ApiResponse<Void> updateMindmap(
            @PathVariable Long docId,
            @RequestBody String content,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("更新思维导图: docId={}, userId={}", docId, user.getId());
            publishService.updateMindmap(docId, content, user.getId()).get();
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("更新思维导图失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @PutMapping("/docs/{docId}/quiz")
    public ApiResponse<Void> updateQuiz(
            @PathVariable Long docId,
            @RequestBody String content,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("更新测试题: docId={}, userId={}", docId, user.getId());
            publishService.updateQuiz(docId, content, user.getId()).get();
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("更新测试题失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @DeleteMapping("/docs/{docId}/interpretation")
    public ApiResponse<Void> deleteInterpretation(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("删除文档解读: docId={}, userId={}", docId, user.getId());
            publishService.deleteInterpretation(docId, user.getId()).get();
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("删除文档解读失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @DeleteMapping("/docs/{docId}/mindmap")
    public ApiResponse<Void> deleteMindmap(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("删除思维导图: docId={}, userId={}", docId, user.getId());
            publishService.deleteMindmap(docId, user.getId()).get();
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("删除思维导图失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @DeleteMapping("/docs/{docId}/quiz")
    public ApiResponse<Void> deleteQuiz(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            logger.info("删除测试题: docId={}, userId={}", docId, user.getId());
            publishService.deleteQuiz(docId, user.getId()).get();
            return ApiResponse.success();
        } catch (Exception e) {
            logger.error("删除测试题失败: docId={}, userId={}, error={}", 
                docId, user.getId(), e.getMessage(), e);
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }
}
