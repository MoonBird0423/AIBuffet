package com.aibuffet.dto;

import com.aibuffet.model.KnowledgeBase;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateKnowledgeBaseRequest {
    
    @NotBlank(message = "知识库名称不能为空")
    @Size(max = 100, message = "知识库名称不能超过100个字符")
    private String name;
    
    private String description;
    
    private KnowledgeBase.Visibility visibility = KnowledgeBase.Visibility.PRIVATE;
    
    private KnowledgeBase.Category category;
    
    @Size(max = 7, message = "颜色标记不能超过7个字符")
    private String colorMark;

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public KnowledgeBase.Visibility getVisibility() {
        return visibility;
    }

    public void setVisibility(KnowledgeBase.Visibility visibility) {
        this.visibility = visibility;
    }

    public KnowledgeBase.Category getCategory() {
        return category;
    }

    public void setCategory(KnowledgeBase.Category category) {
        this.category = category;
    }

    public String getColorMark() {
        return colorMark;
    }

    public void setColorMark(String colorMark) {
        this.colorMark = colorMark;
    }
}
