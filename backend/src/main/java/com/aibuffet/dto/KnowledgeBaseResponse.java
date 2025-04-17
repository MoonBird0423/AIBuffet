package com.aibuffet.dto;

import com.aibuffet.model.KnowledgeBase;
import com.aibuffet.model.KnowledgeBase.Visibility;
import java.time.LocalDateTime;

public class KnowledgeBaseResponse {
    private Visibility visibility;
    private Long id;
    private String name;
    private Long createdBy;
    private String creatorName;
    private String creatorAvatar;
    private Integer usageCount;
    private Integer docsCount;
    private String colorMark;
    private LocalDateTime createdAt;
    private KnowledgeBase.Category category;
    
    private String description;

    // Getters and Setters
    
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getCreatorAvatar() {
        return creatorAvatar;
    }

    public void setCreatorAvatar(String creatorAvatar) {
        this.creatorAvatar = creatorAvatar;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }

    public Integer getDocsCount() {
        return docsCount;
    }

    public void setDocsCount(Integer docsCount) {
        this.docsCount = docsCount;
    }

    public String getColorMark() {
        return colorMark;
    }

    public void setColorMark(String colorMark) {
        this.colorMark = colorMark;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public KnowledgeBase.Category getCategory() {
        return category;
    }

    public void setCategory(KnowledgeBase.Category category) {
        this.category = category;
    }

    public Visibility getVisibility() {
        return visibility;
    }

    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
    }
}
