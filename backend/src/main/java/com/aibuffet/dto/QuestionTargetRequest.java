package com.aibuffet.dto;

import lombok.Data;

/**
 * 提问对象请求DTO
 */
@Data
public class QuestionTargetRequest {
    /**
     * 提问对象类型：book, knowledge
     */
    private String questionTargetType;
    
    /**
     * 提问对象ID
     */
    private String questionTargetId;
    
    /**
     * 提问对象名称
     */
    private String questionTargetName;
}
