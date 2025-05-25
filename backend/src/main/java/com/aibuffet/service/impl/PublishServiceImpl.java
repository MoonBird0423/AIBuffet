package com.aibuffet.service.impl;

import com.aibuffet.model.DocFile;
import com.aibuffet.model.DocInterpretation;
import com.aibuffet.model.DocMindmap;
import com.aibuffet.model.DocQuiz;
import com.aibuffet.model.Model;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.aibuffet.repository.DocFileRepository;
import com.aibuffet.repository.DocInterpretationRepository;
import com.aibuffet.repository.DocMindmapRepository;
import com.aibuffet.repository.DocQuizRepository;
import com.aibuffet.repository.ModelRepository;
import org.springframework.beans.factory.annotation.Value;
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
    private final DocInterpretationRepository docInterpretationRepository;
    private final DocMindmapRepository docMindmapRepository;
    private final DocQuizRepository docQuizRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${book.interpretation.user-prompt}")
    private String interpretationUserPrompt;

    @Value("${book.mindmap.user-prompt}")
    private String mindmapUserPrompt;

    @Value("${book.quiz.user-prompt}")
    private String quizUserPrompt;

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

        // 检查是否已存在openai_file_id
        if (docFile.getOpenaiFileId() != null && !docFile.getOpenaiFileId().isEmpty()) {
            log.info("文档已存在OpenAI文件ID，直接返回: {}", docFile.getOpenaiFileId());
            return docFile.getOpenaiFileId();
        }

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
                    
                    // 保存fileId到数据库
                    docFile.setOpenaiFileId(fileId);
                    docFileRepository.save(docFile);
                    
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
    public CompletableFuture<String> generateContent(String fileId, String userPrompt) {
        return CompletableFuture.supplyAsync((Supplier<String>) () -> {
            log.info("开始生成内容，fileId: {}, userPrompt: {}", fileId, userPrompt);
            
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
    public CompletableFuture<String> generateInterpretation(Long docId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 1. 先检查是否已经存在解读内容
                DocInterpretation existingInterpretation = docInterpretationRepository.findByDocId(docId)
                        .orElse(null);
                if (existingInterpretation != null && existingInterpretation.getContent() != null) {
                    log.info("已存在解读内容，直接返回，docId: {}", docId);
                    return existingInterpretation.getContent();
                }

                // 2. 上传文件获取fileId
                log.info("开始为文档生成解读，docId: {}", docId);
                String fileId = uploadFileAndGetFileId(docId).get();

                // 3. 调用AI生成解读内容
                String content = generateContent(fileId, interpretationUserPrompt).get();

                // 4. 保存解读内容
                DocInterpretation interpretation = new DocInterpretation();
                interpretation.setDocId(docId);
                interpretation.setContent(content);
                docInterpretationRepository.save(interpretation);
                log.info("解读内容已保存，docId: {}", docId);

                return content;
            } catch (Exception e) {
                String errorMsg = String.format("生成解读失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }
    
    @Override
    public CompletableFuture<String> generateMindmap(Long docId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 1. 检查是否已存在脑图内容
                DocMindmap existingMindmap = docMindmapRepository.findByDocId(docId)
                        .orElse(null);
                if (existingMindmap != null && existingMindmap.getContent() != null) {
                    log.info("已存在脑图内容，直接返回，docId: {}", docId);
                    return existingMindmap.getContent();
                }

                // 2. 上传文件获取fileId
                log.info("开始为文档生成脑图，docId: {}", docId);
                String fileId = uploadFileAndGetFileId(docId).get();

                // 3. 调用AI生成脑图内容
                String content = generateContent(fileId, mindmapUserPrompt).get();
                log.debug("AI生成的脑图内容: {}", content);

                // 4. 直接保存为markdown格式
                DocMindmap mindmap = new DocMindmap();
                mindmap.setDocId(docId);
                mindmap.setContent(content);
                docMindmapRepository.save(mindmap);
                log.info("脑图内容已保存，docId: {}", docId);

                return content;
            } catch (Exception e) {
                String errorMsg = String.format("生成脑图失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<String> generateQuiz(Long docId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 1. 检查是否已存在测试题内容
                DocQuiz existingQuiz = docQuizRepository.findByDocId(docId)
                        .orElse(null);
                if (existingQuiz != null && existingQuiz.getQuestions() != null) {
                    log.info("已存在测试题内容，直接返回，docId: {}", docId);
                    return existingQuiz.getQuestions();
                }

                // 2. 上传文件获取fileId
                log.info("开始为文档生成测试题，docId: {}", docId);
                String fileId = uploadFileAndGetFileId(docId).get();

                // 3. 调用AI生成测试题内容并保存
                String content = generateContent(fileId, quizUserPrompt).get();
                DocQuiz quiz = new DocQuiz();
                quiz.setDocId(docId);
                quiz.setQuestions(content);
                docQuizRepository.save(quiz);
                log.info("测试题内容已保存，docId: {}", docId);

                return content;
            } catch (Exception e) {
                String errorMsg = String.format("生成测试题失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<String> getMindmap(Long docId) {
        return CompletableFuture.supplyAsync(() -> {
            DocMindmap mindmap = docMindmapRepository.findByDocId(docId)
                    .orElse(null);
            return mindmap != null ? mindmap.getContent() : null;
        });
    }

    @Override
    public CompletableFuture<String> getQuiz(Long docId) {
        return CompletableFuture.supplyAsync(() -> {
            DocQuiz quiz = docQuizRepository.findByDocId(docId)
                    .orElse(null);
            return quiz != null ? quiz.getQuestions() : null;
        });
    }

    @Override
    public CompletableFuture<String> getInterpretation(Long docId) {
        return CompletableFuture.supplyAsync(() -> {
            DocInterpretation interpretation = docInterpretationRepository.findByDocId(docId)
                    .orElse(null);
            return interpretation != null ? interpretation.getContent() : null;
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
