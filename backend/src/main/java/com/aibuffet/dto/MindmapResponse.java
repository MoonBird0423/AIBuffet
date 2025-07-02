package com.aibuffet.dto;

import com.aibuffet.model.GenerationStatus;
import lombok.Data;

@Data
public class MindmapResponse {
    private String content;
    private GenerationStatus generationStatus;
    
    public MindmapResponse() {}
    
    public MindmapResponse(String content, GenerationStatus generationStatus) {
        this.content = content;
        this.generationStatus = generationStatus;
    }
}
