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
        
        // 验证请求参数
        if (!request.isValid()) {
            return ApiResponse.error(400, "请求参数无效：必须且只能传入知识库ID列表、单个知识库ID或文档ID中的一个");
        }
        
        // 根据搜索类型进行权限验证
        boolean hasPermission = false;
        SearchRequest.SearchType searchType = request.getSearchType();
        
        if (searchType == SearchRequest.SearchType.KNOWLEDGE_BASE) {
            hasPermission = searchService.validateKnowledgeBasePermission(request.getKnowledgeBaseId(), userId);
        } else if (searchType == SearchRequest.SearchType.DOCUMENT) {
            hasPermission = searchService.validateDocumentPermission(request.getDocumentId(), userId);
        } else if (searchType == SearchRequest.SearchType.LEGACY) {
            hasPermission = searchService.validateSearchPermission(request.getKnowledgeBaseIds(), userId);
        }
        
        if (!hasPermission) {
            return ApiResponse.error(403, "无权访问指定的资源");
        }
        
        // 执行检索
        List<SearchResult> results = searchService.search(request);
        return ApiResponse.success(results);
    }
}
