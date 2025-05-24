package com.aibuffet.service;

import java.util.concurrent.CompletableFuture;

public interface PublishService {
    /**
     * 生成并获取图书解读内容
     * @param docId 文档ID
     * @return 解读内容
     */
    CompletableFuture<String> generateInterpretation(Long docId);

    /**
     * 获取图书解读内容
     * @param docId 文档ID
     * @return 解读内容，如果不存在返回null
     */
    CompletableFuture<String> getInterpretation(Long docId);

    /**
     * 生成并获取图书脑图内容
     * @param docId 文档ID
     * @return 脑图内容
     */
    CompletableFuture<String> generateMindmap(Long docId);

    /**
     * 获取图书脑图内容
     * @param docId 文档ID
     * @return 脑图内容，如果不存在返回null
     */
    CompletableFuture<String> getMindmap(Long docId);

    /**
     * 生成并获取图书测试题内容
     * @param docId 文档ID
     * @return 测试题内容
     */
    CompletableFuture<String> generateQuiz(Long docId);

    /**
     * 获取图书测试题内容
     * @param docId 文档ID
     * @return 测试题内容，如果不存在返回null
     */
    CompletableFuture<String> getQuiz(Long docId);

    /**
     * 上传文件到阿里云并获取file-id
     * @param docId 文档ID
     * @return file-id
     */
    CompletableFuture<String> uploadFileAndGetFileId(Long docId);

    /**
     * 调用AI模型生成内容
     * @param fileId 文件ID
     * @param userPrompt 用户提示词
     * @return AI生成的内容
     */
    CompletableFuture<String> generateContent(String fileId, String userPrompt);

    /**
     * 删除阿里云上传的文件
     * @param fileId file-id
     * @return 删除是否成功
     */
    CompletableFuture<Boolean> deleteFile(String fileId);
}
