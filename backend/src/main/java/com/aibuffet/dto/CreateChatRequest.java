package com.aibuffet.dto;

import lombok.Data;

/**
 * 创建聊天会话请求DTO
 */
@Data
public class CreateChatRequest {
    /**
     * 第一条消息内容
     */
    private String message;
    
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
