package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.model.User;
import com.aibuffet.model.KnowledgeBase;
import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.dto.KnowledgeBaseQuery;
import com.aibuffet.dto.KnowledgeBaseResponse;
import com.aibuffet.service.KnowledgeBaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/knowledge-bases")
public class KnowledgeBaseController {

    @Autowired
    private KnowledgeBaseService knowledgeBaseService;
    
    /**
     * 创建知识库
     */
    @PostMapping
    public ApiResponse<KnowledgeBase> createKnowledgeBase(
            @RequestBody CreateKnowledgeBaseRequest request,
            Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        KnowledgeBase knowledgeBase = knowledgeBaseService.createKnowledgeBase(request, userId);
        return ApiResponse.success(knowledgeBase);
    }

    /**
     * 查询知识库列表
     */
    @GetMapping
    public ApiResponse<Page<KnowledgeBaseResponse>> getKnowledgeBases(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") Integer page) {
        
        KnowledgeBaseQuery query = new KnowledgeBaseQuery();
        query.setKeyword(keyword);
        query.setPage(page);
        
        return ApiResponse.success(knowledgeBaseService.findKnowledgeBases(query));
    }

    /**
     * 查询我的知识库
     */
    @GetMapping("/my")
    public ApiResponse<Page<KnowledgeBaseResponse>> getMyKnowledgeBases(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") Integer page,
            Authentication authentication) {
        
        KnowledgeBaseQuery query = new KnowledgeBaseQuery();
        query.setKeyword(keyword);
        query.setPage(page);
        
        return ApiResponse.success(knowledgeBaseService.findMyKnowledgeBases(query, authentication));
    }
    
    /**
     * 删除知识库
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteKnowledgeBase(@PathVariable Long id, Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        knowledgeBaseService.deleteKnowledgeBase(id, userId);
        return ApiResponse.success();
    }
    
    /**
     * 获取知识库详情
     */
    @GetMapping("/{id}")
    public ApiResponse<KnowledgeBaseResponse> getKnowledgeBase(@PathVariable Long id) {
        return ApiResponse.success(knowledgeBaseService.getKnowledgeBase(id));
    }
}
