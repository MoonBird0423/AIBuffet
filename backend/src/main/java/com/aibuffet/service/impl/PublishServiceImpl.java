package com.aibuffet.service.impl;

import com.aibuffet.common.ResourceNotFoundException;
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
import com.aibuffet.service.DocumentService;
import com.aibuffet.service.PromptTemplateService;
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
    private final DocumentService documentService;
    private final PromptTemplateService promptTemplateService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private void verifyDocAccess(Long docId, Long userId) {
        // 直接调用DocumentService的getDocument方法
        // 该方法已经实现了正确的权限检查逻辑，包括：
        // 1. 对于已发布文档：所有用户都可以访问（包括未登录用户）
        // 2. 对于未发布文档：只有在knowledge_base_files表中有关联记录的用户可以访问
        try {
            documentService.getDocument(docId, userId);
        } catch (Exception e) {
            // 重新抛出更友好的错误信息
            if (e instanceof ResourceNotFoundException) {
                throw new ResourceNotFoundException("文档不存在");
            } else if (e instanceof IllegalArgumentException) {
                throw new IllegalArgumentException("无权访问此文档");
            } else {
                throw new RuntimeException("文档访问验证失败: " + e.getMessage(), e);
            }
        }
    }

    private OpenAIClient createClient(Model model) {
        return OpenAIOkHttpClient.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getBaseUrl())
                .build();
    }

    @Override
    public CompletableFuture<String> uploadFileAndGetFileId(Long docId, Long userId) {
        return CompletableFuture.supplyAsync((Supplier<String>) () -> {
            verifyDocAccess(docId, userId);

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
    public CompletableFuture<String> generateContent(String fileId, String userPrompt, Long userId) {
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
    public CompletableFuture<String> generateInterpretation(Long docId, Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                verifyDocAccess(docId, userId);

                // 1. 上传文件获取fileId
                log.info("开始为文档生成解读，docId: {}", docId);
                String fileId = uploadFileAndGetFileId(docId, userId).get();

                // 2. 调用AI生成解读内容
                String prompt = promptTemplateService.getActivePromptContent("book.interpretation.user-prompt");
                String content = generateContent(fileId, prompt, userId).get();

                // 3. 保存解读内容（如果已存在则覆盖）
                DocInterpretation interpretation = docInterpretationRepository.findByDocId(docId)
                        .orElse(new DocInterpretation());
                interpretation.setDocId(docId);
                interpretation.setContent(content);
                docInterpretationRepository.save(interpretation);
                log.info("解读内容已生成并保存，docId: {}", docId);

                return content;
            } catch (Exception e) {
                String errorMsg = "#生成内容失败，请删除后重试。错误信息：" + e.getMessage();
                log.error("生成解读失败：docId={}, error={}", docId, e.getMessage(), e);
                
                // 保存错误信息到数据库
                DocInterpretation interpretation = docInterpretationRepository.findByDocId(docId)
                        .orElse(new DocInterpretation());
                interpretation.setDocId(docId);
                interpretation.setContent(errorMsg);
                docInterpretationRepository.save(interpretation);
                
                throw new RuntimeException(errorMsg, e);
            }
        });
    }
    
    @Override
    public CompletableFuture<String> generateMindmap(Long docId, Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                verifyDocAccess(docId, userId);

                // 1. 上传文件获取fileId
                log.info("开始为文档生成脑图，docId: {}", docId);
                String fileId = uploadFileAndGetFileId(docId, userId).get();

                // 2. 调用AI生成脑图内容
                String prompt = promptTemplateService.getActivePromptContent("book.mindmap.user-prompt");
                String content = generateContent(fileId, prompt, userId).get();
                log.debug("AI生成的脑图内容: {}", content);

                // 3. 保存脑图内容（如果已存在则覆盖）
                DocMindmap mindmap = docMindmapRepository.findByDocId(docId)
                        .orElse(new DocMindmap());
                mindmap.setDocId(docId);
                mindmap.setContent(content);
                docMindmapRepository.save(mindmap);
                log.info("脑图内容已生成并保存，docId: {}", docId);

                return content;
            } catch (Exception e) {
                String errorMsg = "#生成内容失败，请删除后重试。错误信息：" + e.getMessage();
                log.error("生成脑图失败：docId={}, error={}", docId, e.getMessage(), e);
                
                // 保存错误信息到数据库
                DocMindmap mindmap = docMindmapRepository.findByDocId(docId)
                        .orElse(new DocMindmap());
                mindmap.setDocId(docId);
                mindmap.setContent(errorMsg);
                docMindmapRepository.save(mindmap);
                
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<String> generateQuiz(Long docId, Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                verifyDocAccess(docId, userId);

                // 1. 上传文件获取fileId
                log.info("开始为文档生成测试题，docId: {}", docId);
                String fileId = uploadFileAndGetFileId(docId, userId).get();

                // 2. 调用AI生成测试题内容
                String prompt = promptTemplateService.getActivePromptContent("book.quiz.user-prompt");
                String content = generateContent(fileId, prompt, userId).get();

                // 3. 保存测试题内容（如果已存在则覆盖）
                DocQuiz quiz = docQuizRepository.findByDocId(docId)
                        .orElse(new DocQuiz());
                quiz.setDocId(docId);
                quiz.setQuestions(content);
                docQuizRepository.save(quiz);
                log.info("测试题内容已生成并保存，docId: {}", docId);

                return content;
            } catch (Exception e) {
                String errorMsg = "#生成内容失败，请删除后重试。错误信息：" + e.getMessage();
                log.error("生成测试题失败：docId={}, error={}", docId, e.getMessage(), e);
                
                // 保存错误信息到数据库
                DocQuiz quiz = docQuizRepository.findByDocId(docId)
                        .orElse(new DocQuiz());
                quiz.setDocId(docId);
                quiz.setQuestions(errorMsg);
                docQuizRepository.save(quiz);
                
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<String> getMindmap(Long docId, Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            verifyDocAccess(docId, userId);

            DocMindmap mindmap = docMindmapRepository.findByDocId(docId)
                    .orElse(null);
            return mindmap != null ? mindmap.getContent() : null;
        });
    }

    @Override
    public CompletableFuture<String> getQuiz(Long docId, Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            verifyDocAccess(docId, userId);

            DocQuiz quiz = docQuizRepository.findByDocId(docId)
                    .orElse(null);
            return quiz != null ? quiz.getQuestions() : null;
        });
    }

    @Override
    public CompletableFuture<String> getInterpretation(Long docId, Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            verifyDocAccess(docId, userId);

            DocInterpretation interpretation = docInterpretationRepository.findByDocId(docId)
                    .orElse(null);
            return interpretation != null ? interpretation.getContent() : null;
        });
    }

    @Override
    public CompletableFuture<Boolean> deleteFile(String fileId, Long userId) {
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

    @Override
    public CompletableFuture<Void> updateInterpretation(Long docId, String content, Long userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("开始更新解读内容，docId: {}, userId: {}", docId, userId);
                verifyDocAccess(docId, userId);

                DocInterpretation interpretation = docInterpretationRepository.findByDocId(docId)
                        .orElse(new DocInterpretation());
                
                interpretation.setDocId(docId);
                interpretation.setContent(content);
                docInterpretationRepository.save(interpretation);
                
                log.info("解读内容更新成功，docId: {}", docId);
            } catch (Exception e) {
                String errorMsg = String.format("更新解读内容失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<Void> updateMindmap(Long docId, String content, Long userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("开始更新脑图内容，docId: {}, userId: {}", docId, userId);
                verifyDocAccess(docId, userId);

                DocMindmap mindmap = docMindmapRepository.findByDocId(docId)
                        .orElse(new DocMindmap());
                
                mindmap.setDocId(docId);
                mindmap.setContent(content);
                docMindmapRepository.save(mindmap);
                
                log.info("脑图内容更新成功，docId: {}", docId);
            } catch (Exception e) {
                String errorMsg = String.format("更新脑图内容失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<Void> updateQuiz(Long docId, String content, Long userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("开始更新测试题内容，docId: {}, userId: {}", docId, userId);
                verifyDocAccess(docId, userId);

                DocQuiz quiz = docQuizRepository.findByDocId(docId)
                        .orElse(new DocQuiz());
                
                quiz.setDocId(docId);
                quiz.setQuestions(content);
                docQuizRepository.save(quiz);
                
                log.info("测试题内容更新成功，docId: {}", docId);
            } catch (Exception e) {
                String errorMsg = String.format("更新测试题内容失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<Void> deleteInterpretation(Long docId, Long userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("开始删除解读内容，docId: {}, userId: {}", docId, userId);
                verifyDocAccess(docId, userId);

                docInterpretationRepository.findByDocId(docId)
                        .ifPresent(interpretation -> {
                            docInterpretationRepository.delete(interpretation);
                            log.info("解读内容删除成功，docId: {}", docId);
                        });
            } catch (Exception e) {
                String errorMsg = String.format("删除解读内容失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<Void> deleteMindmap(Long docId, Long userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("开始删除脑图内容，docId: {}, userId: {}", docId, userId);
                verifyDocAccess(docId, userId);

                docMindmapRepository.findByDocId(docId)
                        .ifPresent(mindmap -> {
                            docMindmapRepository.delete(mindmap);
                            log.info("脑图内容删除成功，docId: {}", docId);
                        });
            } catch (Exception e) {
                String errorMsg = String.format("删除脑图内容失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }

    @Override
    public CompletableFuture<Void> deleteQuiz(Long docId, Long userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("开始删除测试题内容，docId: {}, userId: {}", docId, userId);
                verifyDocAccess(docId, userId);

                docQuizRepository.findByDocId(docId)
                        .ifPresent(quiz -> {
                            docQuizRepository.delete(quiz);
                            log.info("测试题内容删除成功，docId: {}", docId);
                        });
            } catch (Exception e) {
                String errorMsg = String.format("删除测试题内容失败：docId=%s, error=%s", docId, e.getMessage());
                log.error(errorMsg, e);
                throw new RuntimeException(errorMsg, e);
            }
        });
    }
}
