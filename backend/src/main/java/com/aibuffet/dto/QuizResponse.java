package com.aibuffet.dto;

import com.aibuffet.model.GenerationStatus;
import lombok.Data;

@Data
public class QuizResponse {
    private String questions;
    private GenerationStatus generationStatus;
    
    public QuizResponse() {}
    
    public QuizResponse(String questions, GenerationStatus generationStatus) {
        this.questions = questions;
        this.generationStatus = generationStatus;
    }
}
