package com.aibuffet.service;

import java.util.concurrent.CompletableFuture;

public interface PublishService {
    /**
     * 上传文件到阿里云并获取file-id
     * @param docId 文档ID
     * @return file-id
     */
    CompletableFuture<String> uploadFileAndGetFileId(Long docId);

    /**
     * 调用AI模型生成内容
     * @param fileId 文件ID
     * @param systemPrompt 系统提示词
     * @param userPrompt 用户提示词
     * @return AI生成的内容
     */
    CompletableFuture<String> generateContent(String fileId, String systemPrompt, String userPrompt);

    /**
     * 删除阿里云上传的文件
     * @param fileId file-id
     * @return 删除是否成功
     */
    CompletableFuture<Boolean> deleteFile(String fileId);
}
