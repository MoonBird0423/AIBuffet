package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.dto.SearchRequest;
import com.aibuffet.dto.SearchResult;
import com.aibuffet.model.User;
import com.aibuffet.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    
    @Autowired
    private SearchService searchService;
    
    @PostMapping
    public ApiResponse<List<SearchResult>> search(
            @Valid @RequestBody SearchRequest request,
            Authentication authentication) {
            
        // 获取当前用户ID
        Long userId = ((User) authentication.getPrincipal()).getId();
        
        // 验证权限
        if (!searchService.validateSearchPermission(request.getKnowledgeBaseIds(), userId)) {
            return ApiResponse.error(403, "无权访问指定的知识库");
        }
        
        // 执行检索
        List<SearchResult> results = searchService.search(request);
        return ApiResponse.success(results);
    }
}
