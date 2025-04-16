package com.aibuffet.dto;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public class KnowledgeBaseQuery {
    private String category;
    private String keyword;
    private String orderBy;
    private Integer page = 0;
    private Integer size = 30;

    public PageRequest toPageRequest() {
        Sort sort = switch (orderBy) {
            case "usage" -> Sort.by(Sort.Direction.DESC, "usageCount");
            case "docs" -> Sort.by(Sort.Direction.DESC, "docsCount");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        return PageRequest.of(page, size, sort);
    }

    // Getters and Setters
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public String getOrderBy() {
        return orderBy;
    }

    public void setOrderBy(String orderBy) {
        this.orderBy = orderBy == null ? "latest" : orderBy;
    }

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page == null ? 0 : page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size == null ? 30 : size;
    }
}
