package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.BenefitCheck;
import com.aibuffet.common.BenefitUsage;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.model.User;
import com.aibuffet.service.AudioSynthesisService;
import com.aibuffet.service.MultiRoleAudioSynthesisService;
import com.aibuffet.service.PublishService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentAudioController {
    private static final Logger logger = LoggerFactory.getLogger(DocumentAudioController.class);

    @Autowired
    private AudioSynthesisService audioSynthesisService;

    @Autowired
    private MultiRoleAudioSynthesisService multiRoleAudioSynthesisService;

    @Autowired
    private PublishService publishService;

    /**
     * 为指定文档生成音频
     * @param docId 文档ID
     * @return 音频合成结果
     */
    @PostMapping("/{docId}/audio/synthesize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> synthesizeAudio(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            Long userId = user.getId();
            logger.info("开始为文档生成音频: 文档ID={}, 用户ID={}", docId, userId);

            // 检查是否已有音频
            if (audioSynthesisService.hasAudio(docId)) {
                String existingAudioUrl = audioSynthesisService.getAudioUrl(docId);
                logger.info("文档已有音频，返回现有URL: 文档ID={}, URL={}", docId, existingAudioUrl);
                
                Map<String, Object> result = new HashMap<>();
                result.put("audioUrl", existingAudioUrl);
                result.put("isNew", false);
                result.put("status", "completed");
                return ResponseEntity.ok(ApiResponse.success(result));
            }

            // 启动异步音频生成任务
            audioSynthesisService.synthesizeAudioAsync(docId, userId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "processing");
            result.put("message", "音频生成已启动");
            result.put("isNew", true);
            
            logger.info("音频生成任务已启动: 文档ID={}", docId);
            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (Exception e) {
            logger.error("启动音频生成失败: 文档ID={}, 错误={}", docId, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(ErrorCode.SYSTEM_ERROR, "启动音频生成失败: " + e.getMessage()));
        }
    }

    /**
     * 获取指定文档的音频URL
     * @param docId 文档ID
     * @param user 用户信息（可选）
     * @return 音频URL
     */
    @GetMapping("/{docId}/audio")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAudioUrl(
            @PathVariable Long docId,
            @AuthenticationPrincipal(errorOnInvalidType = false) User user) {
        try {
            Long userId = user != null ? user.getId() : null;
            logger.info("获取文档音频URL: 文档ID={}, 用户ID={}", docId, userId);
            
            String audioUrl = audioSynthesisService.getAudioUrlSecure(docId, userId);
            boolean hasAudio = audioUrl != null && !audioUrl.trim().isEmpty();
            
            Map<String, Object> result = new HashMap<>();
            result.put("audioUrl", audioUrl);
            result.put("hasAudio", hasAudio);
            
            logger.info("获取音频URL完成: 文档ID={}, 有音频={}, URL={}", docId, hasAudio, audioUrl);
            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (Exception e) {
            logger.error("获取音频URL失败: 文档ID={}, 错误={}", docId, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(ErrorCode.SYSTEM_ERROR, "获取音频URL失败: " + e.getMessage()));
        }
    }

    /**
     * 检查指定文档是否有音频
     * @param docId 文档ID
     * @param user 用户信息（可选）
     * @return 是否有音频及状态信息
     */
    @GetMapping("/{docId}/audio/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAudioStatus(
            @PathVariable Long docId,
            @AuthenticationPrincipal(errorOnInvalidType = false) User user) {
        try {
            Long userId = user != null ? user.getId() : null;
            logger.info("检查文档音频状态: 文档ID={}, 用户ID={}", docId, userId);
            
            boolean hasAudio = audioSynthesisService.hasAudioSecure(docId, userId);
            String audioUrl = hasAudio ? audioSynthesisService.getAudioUrlSecure(docId, userId) : null;
            
            // 获取音频生成状态
            String audioStatus = null;
            try {
                // 通过PublishService获取解读信息中的音频状态
                com.aibuffet.service.impl.PublishServiceImpl publishServiceImpl = 
                    (com.aibuffet.service.impl.PublishServiceImpl) publishService;
                com.aibuffet.model.DocInterpretation interpretation = 
                    publishServiceImpl.getInterpretationWithStatus(docId, userId).get();
                
                if (interpretation != null && interpretation.getAudioStatus() != null) {
                    audioStatus = interpretation.getAudioStatus().name();
                }
            } catch (Exception e) {
                logger.warn("获取音频状态失败: docId={}, error={}", docId, e.getMessage());
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("hasAudio", hasAudio);
            result.put("audioUrl", audioUrl);
            result.put("audioStatus", audioStatus);
            
            logger.info("音频状态检查完成: 文档ID={}, 有音频={}, 状态={}", docId, hasAudio, audioStatus);
            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (Exception e) {
            logger.error("检查音频状态失败: 文档ID={}, 错误={}", docId, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(ErrorCode.SYSTEM_ERROR, "检查音频状态失败: " + e.getMessage()));
        }
    }

    /**
     * 删除指定文档的音频
     * @param docId 文档ID
     * @return 删除结果
     */
    @DeleteMapping("/{docId}/audio")
    public ResponseEntity<ApiResponse<String>> deleteAudio(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            Long userId = user.getId();
            logger.info("开始删除文档音频: 文档ID={}, 用户ID={}", docId, userId);
            
            audioSynthesisService.deleteAudio(docId, userId);
            
            logger.info("音频删除成功: 文档ID={}", docId);
            return ResponseEntity.ok(ApiResponse.success("音频删除成功"));
            
        } catch (Exception e) {
            logger.error("音频删除失败: 文档ID={}, 错误={}", docId, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(ErrorCode.SYSTEM_ERROR, "音频删除失败: " + e.getMessage()));
        }
    }

    /**
     * 为指定文档生成多角色语音
     * @param docId 文档ID
     * @return 多角色语音合成结果
     */
    @BenefitCheck("api:documents:synthesizeMultiRoleAudio")
    @BenefitUsage(identifier = "api:documents:synthesizeMultiRoleAudio", amount = 1)
    @PostMapping("/{docId}/audio/multi-role-synthesize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> synthesizeMultiRoleAudio(
            @PathVariable Long docId,
            @AuthenticationPrincipal User user) {
        try {
            Long userId = user.getId();
            logger.info("开始为文档生成多角色语音: 文档ID={}, 用户ID={}", docId, userId);

            // 检查是否已有音频（单角色或多角色）
            if (audioSynthesisService.hasAudio(docId)) {
                String existingAudioUrl = audioSynthesisService.getAudioUrl(docId);
                logger.info("文档已有音频，返回现有URL: 文档ID={}, URL={}", docId, existingAudioUrl);
                
                Map<String, Object> result = new HashMap<>();
                result.put("audioUrl", existingAudioUrl);
                result.put("isNew", false);
                result.put("status", "completed");
                result.put("type", "multi-role");
                return ResponseEntity.ok(ApiResponse.success(result));
            }

            // 启动异步多角色语音生成任务
            multiRoleAudioSynthesisService.synthesizeMultiRoleAudioAsync(docId, userId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "processing");
            result.put("message", "多角色语音生成已启动");
            result.put("isNew", true);
            result.put("type", "multi-role");
            
            logger.info("多角色语音生成任务已启动: 文档ID={}", docId);
            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (Exception e) {
            logger.error("启动多角色语音生成失败: 文档ID={}, 错误={}", docId, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(ErrorCode.SYSTEM_ERROR, "启动多角色语音生成失败: " + e.getMessage()));
        }
    }
}
