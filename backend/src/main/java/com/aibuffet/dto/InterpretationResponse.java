package com.aibuffet.dto;

import com.aibuffet.model.GenerationStatus;
import lombok.Data;

@Data
public class InterpretationResponse {
    private String content;
    private GenerationStatus interpretationStatus;
    private String audioUrl;
    private GenerationStatus audioStatus;
    
    public InterpretationResponse() {}
    
    public InterpretationResponse(String content, GenerationStatus interpretationStatus, 
                                String audioUrl, GenerationStatus audioStatus) {
        this.content = content;
        this.interpretationStatus = interpretationStatus;
        this.audioUrl = audioUrl;
        this.audioStatus = audioStatus;
    }
}
