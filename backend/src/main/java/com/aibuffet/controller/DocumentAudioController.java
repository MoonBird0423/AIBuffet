package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.model.User;
import com.aibuffet.service.AudioSynthesisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentAudioController {
    private static final Logger logger = LoggerFactory.getLogger(DocumentAudioController.class);

    @Autowired
    private AudioSynthesisService audioSynthesisService;

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
                return ResponseEntity.ok(ApiResponse.success(result));
            }

            // 生成新音频
            String audioUrl = audioSynthesisService.synthesizeAudioForInterpretation(docId, userId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("audioUrl", audioUrl);
            result.put("isNew", true);
            
            logger.info("音频生成成功: 文档ID={}, 音频URL={}", docId, audioUrl);
            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (Exception e) {
            logger.error("音频生成失败: 文档ID={}, 错误={}", docId, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(ErrorCode.SYSTEM_ERROR, "音频生成失败: " + e.getMessage()));
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
     * @return 是否有音频
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
            
            Map<String, Object> result = new HashMap<>();
            result.put("hasAudio", hasAudio);
            result.put("audioUrl", audioUrl);
            
            logger.info("音频状态检查完成: 文档ID={}, 有音频={}", docId, hasAudio);
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
}
