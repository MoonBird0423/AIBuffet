package com.aibuffet.service.impl;

import com.aibuffet.model.DocFile;
import com.aibuffet.model.Model;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.ModelRepository;
import com.aibuffet.service.PublishService;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.*;
import com.openai.core.http.StreamResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublishServiceImpl implements PublishService {
    private final DocFileRepository docFileRepository;
    private final ModelRepository modelRepository;

    private OpenAIClient createClient(Model model) {
        return OpenAIOkHttpClient.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getBaseUrl())
                .build();
    }

    @Override
    public CompletableFuture<String> uploadFileAndGetFileId(Long docId) {
        return CompletableFuture.supplyAsync((Supplier<String>) () -> {
            // 1. 获取发布用途的模型信息
            Model model = modelRepository.findByPurposeExact("发布")
                    .orElseThrow(() -> new RuntimeException("未找到发布用途的模型"));
            
            // 2. 获取文档内容
            DocFile docFile = docFileRepository.findById(docId)
                    .orElseThrow(() -> new RuntimeException("文档不存在"));

            String content = docFile.getExtractedText();
            if (content == null || content.isEmpty()) {
                throw new RuntimeException("文档内容为空");
            }

            try {
                // 3. 创建临时文件
                Path tempFile = Files.createTempFile("upload", ".txt");
                try {
                    log.info("正在写入文件内容到临时文件: {}", tempFile);
                    Files.write(tempFile, content.getBytes(StandardCharsets.UTF_8));

                    // 4. 创建客户端并上传文件
                    log.info("正在创建客户端并上传文件...");
                    OpenAIClient client = createClient(model);
                    FileCreateParams fileParams = FileCreateParams.builder()
                            .file(tempFile)
                            .purpose(FilePurpose.of("file-extract"))
                            .build();

                    // 5. 获取file-id
                    FileObject fileObject = client.files().create(fileParams);
                    String fileId = fileObject.id();
                    log.info("文件上传成功，获取到file-id: {}", fileId);
                    return fileId;
                } finally {
                    // 6. 删除临时文件
                    try {
                        Files.deleteIfExists(tempFile);
                        log.debug("临时文件已删除: {}", tempFile);
                    } catch (IOException e) {
                        log.warn("删除临时文件失败: {}", tempFile, e);
                    }
                }
            } catch (IOException e) {
                log.error("上传文件失败: {}", e.getMessage(), e);
                throw new RuntimeException("上传文件失败: " + e.getMessage(), e);
            }
        });
    }

    @Override
    public CompletableFuture<String> generateContent(String fileId, String systemPrompt, String userPrompt) {
        return CompletableFuture.supplyAsync((Supplier<String>) () -> {
            log.info("开始生成内容，fileId: {}, systemPrompt: {}, userPrompt: {}", fileId, systemPrompt, userPrompt);
            
            // 1. 获取发布用途的模型信息
            Model model = modelRepository.findByPurposeExact("发布")
                    .orElseThrow(() -> new RuntimeException("未找到发布用途的模型"));
            log.info("获取到模型信息: {}", model.getName());

            try {
                // 2. 创建客户端
                log.debug("正在创建AI客户端...");
                OpenAIClient client = createClient(model);

                // 3. 创建聊天请求参数
                log.debug("正在构建聊天请求参数...");
                ChatCompletionCreateParams chatParams = ChatCompletionCreateParams.builder()
                        .addSystemMessage("You are a helpful assistant.")
                        .addSystemMessage(systemPrompt)
                        .addSystemMessage("fileid://" + fileId)
                        .addUserMessage(userPrompt)
                        .model(model.getName())
                        .build();

                // 4. 发送请求并获取流式响应
                log.info("开始发送请求获取流式响应...");
                StringBuilder fullResponse = new StringBuilder();
                try (StreamResponse<ChatCompletionChunk> streamResponse = 
                        client.chat().completions().createStreaming(chatParams)) {
                    streamResponse.stream().forEach(chunk -> {
                        String content = chunk.choices().get(0).delta().content().orElse("");
                        if (!content.isEmpty()) {
                            fullResponse.append(content);
                        }
                    });
                }

                String result = fullResponse.toString();
                log.info("内容生成完成，生成结果长度: {} 字符", result.length());
                return result;
            } catch (Exception e) {
                String errorMsg = String.format("生成内容失败：fileId=%s, error=%s", fileId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<Boolean> deleteFile(String fileId) {
        return CompletableFuture.supplyAsync(() -> {
            log.info("开始删除文件，fileId: {}", fileId);
            
            // 1. 获取发布用途的模型信息
            Model model = modelRepository.findByPurposeExact("发布")
                    .orElseThrow(() -> new RuntimeException("未找到发布用途的模型"));
            log.info("获取到模型信息: {}", model.getName());

            try {
                // 2. 创建客户端
                log.debug("正在创建AI客户端...");
                OpenAIClient client = createClient(model);

                // 3. 创建删除参数并执行删除
                log.info("正在删除文件...");
                FileDeleteParams deleteParams = FileDeleteParams.builder()
                        .fileId(fileId)
                        .build();

                // 4. 执行删除操作
                client.files().delete(deleteParams);
                log.info("文件删除成功，fileId: {}", fileId);
                return true;
            } catch (Exception e) {
                String errorMsg = String.format("删除文件失败：fileId=%s, error=%s", fileId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }
}
