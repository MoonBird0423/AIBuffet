package com.aibuffet.service;

import java.util.concurrent.CompletableFuture;

public interface PublishService {
    /**
     * 生成并获取图书解读内容
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 解读内容
     */
    CompletableFuture<String> generateInterpretation(Long docId, Long userId);

    /**
     * 获取图书解读内容
     * @param docId 文档ID
     * @param userId 用户ID，可选，为null时只能访问公开发布的文档
     * @return 解读内容，如果不存在返回null
     */
    CompletableFuture<String> getInterpretation(Long docId, Long userId);

    /**
     * 生成并获取图书脑图内容
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 脑图内容
     */
    CompletableFuture<String> generateMindmap(Long docId, Long userId);

    /**
     * 获取图书脑图内容
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 脑图内容，如果不存在返回null
     */
    CompletableFuture<String> getMindmap(Long docId, Long userId);

    /**
     * 生成并获取图书测试题内容
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 测试题内容
     */
    CompletableFuture<String> generateQuiz(Long docId, Long userId);

    /**
     * 获取图书测试题内容
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 测试题内容，如果不存在返回null
     */
    CompletableFuture<String> getQuiz(Long docId, Long userId);

    /**
     * 上传文件到阿里云并获取file-id
     * @param docId 文档ID
     * @param userId 用户ID
     * @return file-id
     */
    CompletableFuture<String> uploadFileAndGetFileId(Long docId, Long userId);

    /**
     * 调用AI模型生成内容
     * @param fileId 文件ID
     * @param userPrompt 用户提示词
     * @param userId 用户ID
     * @return AI生成的内容
     */
    CompletableFuture<String> generateContent(String fileId, String userPrompt, Long userId);

    /**
     * 删除阿里云上传的文件
     * @param fileId file-id
     * @param userId 用户ID
     * @return 删除是否成功
     */
    CompletableFuture<Boolean> deleteFile(String fileId, Long userId);

    /**
     * 更新图书解读内容
     * @param docId 文档ID
     * @param content 新的解读内容
     * @param userId 用户ID
     * @return void
     */
    CompletableFuture<Void> updateInterpretation(Long docId, String content, Long userId);

    /**
     * 更新图书脑图内容
     * @param docId 文档ID
     * @param content 新的脑图内容
     * @param userId 用户ID
     * @return void
     */
    CompletableFuture<Void> updateMindmap(Long docId, String content, Long userId);

    /**
     * 更新图书测试题内容
     * @param docId 文档ID
     * @param content 新的测试题内容
     * @param userId 用户ID
     * @return void
     */
    CompletableFuture<Void> updateQuiz(Long docId, String content, Long userId);
}
