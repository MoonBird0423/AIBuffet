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
     * @param request 创建请求
     * @param authentication 认证信息
     * @return 创建的知识库
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
     * 查询公开知识库
     * @param category 分类（可选）
     * @param keyword 搜索关键词（可选）
     * @param orderBy 排序方式（latest/usage/docs）
     * @param page 页码，从0开始
     * @return 分页结果
     */
    @GetMapping("/public")
    public ApiResponse<Page<KnowledgeBaseResponse>> getPublicKnowledgeBases(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String orderBy,
            @RequestParam(defaultValue = "0") Integer page) {
        
        KnowledgeBaseQuery query = new KnowledgeBaseQuery();
        query.setCategory(category);
        query.setKeyword(keyword);
        query.setOrderBy(orderBy);
        query.setPage(page);
        
        return ApiResponse.success(knowledgeBaseService.findPublicKnowledgeBases(query));
    }

    /**
     * 查询我的知识库
     * @param keyword 搜索关键词（可选）
     * @param page 页码，从0开始
     * @param authentication 认证信息
     * @return 分页结果
     */
    @GetMapping("/my")
    public ApiResponse<Page<KnowledgeBaseResponse>> getMyKnowledgeBases(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") Integer page,
            Authentication authentication) {
        
        KnowledgeBaseQuery query = new KnowledgeBaseQuery();
        query.setKeyword(keyword);
        query.setPage(page);
        query.setOrderBy("latest"); // 固定按创建时间倒序
        
        return ApiResponse.success(knowledgeBaseService.findMyKnowledgeBases(query, authentication));
    }
}
