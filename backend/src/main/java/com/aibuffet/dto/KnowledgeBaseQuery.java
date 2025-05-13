package com.aibuffet.dto;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public class KnowledgeBaseQuery {
    private String keyword;
    private Integer page = 0;
    private Integer size = 30;

    public PageRequest toPageRequest() {
        return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // Getters and Setters
    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
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
