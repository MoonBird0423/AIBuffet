package com.aibuffet.service;

import java.io.IOException;
import java.util.List;

import com.aibuffet.model.TextChunk;

public interface TextProcessingService {
    /**
     * 从文件中提取文本
     *
     * @param fileUrl OSS文件URL
     * @return 提取的文本内容
     * @throws IOException 如果文本提取失败
     */
    String extractText(String fileUrl) throws IOException;

    /**
     * 将文本分割成块
     *
     * @param text 输入文本
     * @return 文本块列表
     */
    List<TextChunk> createChunks(String text);

    /**
     * 计算文本的token数量
     *
     * @param text 输入文本
     * @return token数量
     */
    int countTokens(String text);
}
