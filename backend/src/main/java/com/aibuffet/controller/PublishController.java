package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.service.PublishService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/publish")
@RequiredArgsConstructor
public class PublishController {
    
    private final PublishService publishService;

    @GetMapping("/docs/{docId}/interpretation")
    public ApiResponse<String> getInterpretation(@PathVariable Long docId) {
        try {
            String content = publishService.getInterpretation(docId).get();
            return ApiResponse.success(content);
        } catch (Exception e) {
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @PostMapping("/docs/{docId}/interpretation/generate")
    public ApiResponse<Void> generateInterpretation(@PathVariable Long docId) {
        try {
            publishService.generateInterpretation(docId);
            return ApiResponse.success();
        } catch (Exception e) {
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }
}
