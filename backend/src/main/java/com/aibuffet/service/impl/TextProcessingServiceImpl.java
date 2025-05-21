package com.aibuffet.service.impl;

import com.aibuffet.config.TextProcessingProperties;
import com.aibuffet.model.TextChunk;
import com.aibuffet.service.OSSService;
import com.aibuffet.service.TextProcessingService;
import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.Parser;
import org.apache.tika.sax.BodyContentHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.apache.tika.parser.ParseContext;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TextProcessingServiceImpl implements TextProcessingService {
    private static final Logger logger = LoggerFactory.getLogger(TextProcessingServiceImpl.class);
    private static final String SENTENCE_DELIMITER = "(?<=[。！？.!?])\\s*(?!\\s)";

    private final Tika tika;
    private final TextProcessingProperties properties;
    private final OSSService ossService;

    @Autowired
    public TextProcessingServiceImpl(
            Tika tika,
            TextProcessingProperties properties,
            OSSService ossService) {
        this.tika = tika;
        this.properties = properties;
        this.ossService = ossService;
    }

    @Override
    public String extractText(String fileUrl) throws IOException {
        logger.info("开始提取文本内容: fileUrl={}", fileUrl);
        try (InputStream inputStream = new BufferedInputStream(ossService.downloadFile(fileUrl))) {
            // 使用Tika的增量解析器
            Parser parser = new AutoDetectParser();
            BodyContentHandler handler = new BodyContentHandler(-1); // -1表示无限制
            Metadata metadata = new Metadata();
            ParseContext context = new ParseContext();
            
            logger.debug("开始解析文档...");
            parser.parse(inputStream, handler, metadata, context);
            
            String text = handler.toString();
            logger.debug("文本提取完成: 原始文本长度={}, 文档类型={}", 
                text.length(), metadata.get("Content-Type"));
            
            String processedText = preprocessFullText(text);
            logger.debug("文本预处理完成: 处理后长度={}", processedText.length());
            
            if (processedText.isEmpty()) {
                throw new IOException("提取的文本内容为空");
            }
            
            return processedText;
        } catch (Exception e) {
            logger.error("文本提取失败: {}", e.getMessage(), e);
            throw new IOException("文本提取失败: " + e.getMessage(), e);
        }
    }

    @Override
    public List<TextChunk> createChunks(String text) {
        logger.info("开始文本分块: 输入文本长度={}", text.length());
        
        // 预处理文本
        text = preprocessText(text);
        
        // 使用正则表达式进行句子分割
        String[] sentences = text.split(SENTENCE_DELIMITER);
        logger.debug("句子分割完成: 句子数={}", sentences.length);
        
        List<TextChunk> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        int currentTokens = 0;
        int startIndex = 0;
        int chunkIndex = 0;
        
        for (String sentence : sentences) {
            if (sentence.trim().isEmpty()) {
                continue;
            }
            
            int sentenceTokens = countTokens(sentence);
            
            // 如果当前块加上这个句子会超出最大token数
            if (currentTokens + sentenceTokens > properties.getMaxTokensPerChunk()) {
                if (currentChunk.length() > 0) {
                    // 保存当前块
                    chunks.add(createChunk(currentChunk.toString(), currentTokens, startIndex, chunkIndex));
                    
                    // 如果需要重叠，保留最后一个句子
                    if (properties.getChunkOverlap() > 0) {
                        String[] lastSentences = currentChunk.toString().split(SENTENCE_DELIMITER);
                        if (lastSentences.length > 0) {
                            String lastSentence = lastSentences[lastSentences.length - 1];
                            currentChunk = new StringBuilder(lastSentence).append(" ");
                            currentTokens = countTokens(lastSentence);
                            startIndex = Math.max(0, startIndex + currentChunk.length() - properties.getChunkOverlap());
                        } else {
                            currentChunk = new StringBuilder();
                            currentTokens = 0;
                        }
                    } else {
                        currentChunk = new StringBuilder();
                        currentTokens = 0;
                    }
                    chunkIndex++;
                }
            }
            
            // 智能添加分隔符
            currentChunk.append(sentence);
            if (!sentence.matches(".*[。！？.!?]\\s*$")) {
                currentChunk.append(" ");
            }
            currentTokens += sentenceTokens;
        }
        
        // 处理最后一个块
        if (currentChunk.length() > 0) {
            chunks.add(createChunk(currentChunk.toString(), currentTokens, startIndex, chunkIndex));
        }
        
        logger.info("文本分块完成: 块数={}", chunks.size());
        return chunks;
    }

    @Override
    public int countTokens(String text) {
        // 按照中英文混合文本的特点进行分词：
        // 1. 按空格分割英文单词
        // 2. 按标点符号分割
        // 3. 每个中文字符视为一个token
        String[] words = text.split("[\\s,.!?，。！？]+");
        int tokenCount = 0;
        for (String word : words) {
            if (!word.isEmpty()) {
                // 中文字符计数
                tokenCount += word.codePoints().filter(ch -> Character.UnicodeScript.of(ch) == Character.UnicodeScript.HAN).count();
                // 非中文部分按单词计数
                tokenCount += word.codePoints().filter(ch -> Character.UnicodeScript.of(ch) != Character.UnicodeScript.HAN).count() > 0 ? 1 : 0;
            }
        }
        return tokenCount;
    }

    private String preprocessFullText(String text) {
        if (text == null) {
            return "";
        }
        
        return text
            // 规范化空格：将多个连续空格替换为单个空格
            .replaceAll("\\s+", " ")
            // 替换特殊空格字符
            .replaceAll("[\\\\]+", " ")
            // 规范化换行：将多个连续换行替换为双换行（形成段落）
            .replaceAll("\\n{3,}", "\n\n")
            // 移除不可打印字符（保留回车换行）
            .replaceAll("[\\p{C}&&[^\r\n]]+", "")
            // 去除首尾空白
            .trim();
    }

    private String preprocessText(String text) {
        // 规范化空格：将多个连续空格替换为单个空格，并去除首尾空格
        return text.replaceAll("\\s+", " ").trim();
    }

    private TextChunk createChunk(String content, int tokenCount, int startIndex, int chunkIndex) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("chunkIndex", chunkIndex);
        metadata.put("startIndex", startIndex);
        metadata.put("endIndex", startIndex + content.length());
        
        return new TextChunk(
            content.trim(),
            tokenCount,
            startIndex,
            startIndex + content.length(),
            metadata
        );
    }
}
