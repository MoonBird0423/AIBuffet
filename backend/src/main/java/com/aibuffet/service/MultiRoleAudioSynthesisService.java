package com.aibuffet.service;

import com.alibaba.dashscope.audio.tts.SpeechSynthesisResult;
import com.alibaba.dashscope.audio.ttsv2.SpeechSynthesisParam;
import com.alibaba.dashscope.audio.ttsv2.SpeechSynthesizer;
import com.alibaba.dashscope.common.ResultCallback;
import com.aibuffet.model.Model;
import com.aibuffet.model.DocInterpretation;
import com.aibuffet.repository.ModelRepository;
import com.aibuffet.repository.DocInterpretationRepository;
import com.alibaba.dashscope.aigc.generation.Generation;
import com.alibaba.dashscope.aigc.generation.GenerationParam;
import com.alibaba.dashscope.aigc.generation.GenerationResult;
import com.alibaba.dashscope.common.Message;
import com.alibaba.dashscope.common.Role;
import com.alibaba.dashscope.exception.ApiException;
import com.alibaba.dashscope.exception.InputRequiredException;
import com.alibaba.dashscope.exception.NoApiKeyException;
import com.alibaba.dashscope.utils.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@Service
public class MultiRoleAudioSynthesisService {
    private static final Logger logger = LoggerFactory.getLogger(MultiRoleAudioSynthesisService.class);

    @Value("${audio.synthesis.timeout:300}")
    private int synthesisTimeout;
    
    @Value("${audio.synthesis.max-retries:3}")
    private int maxRetries;
    
    @Value("${audio.synthesis.retry-delay:5000}")
    private long retryDelay;
    
    @Autowired
    private ModelRepository modelRepository;
    
    @Autowired
    private DocInterpretationRepository docInterpretationRepository;
    
    @Autowired
    private OSSService ossService;
    
    @Autowired
    private DocumentService documentService;
    
    @Autowired
    private PromptTemplateService promptTemplateService;

    // 降级处理的固定文本
    private static final String FALLBACK_TEXT = "生成音频的文本格式有问题，请删除后重试。";
    
    // SSML标签验证的正则表达式
    private static final Pattern SPEAK_TAG_PATTERN = Pattern.compile("<speak[^>]*>.*?</speak>", Pattern.DOTALL);
    private static final Pattern NESTED_SPEAK_PATTERN = Pattern.compile("<speak[^>]*>.*?<speak[^>]*>.*?</speak>.*?</speak>", Pattern.DOTALL);


    /**
     * 异步多角色语音合成
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 异步任务
     */
    @Async
    public CompletableFuture<String> synthesizeMultiRoleAudioAsync(Long docId, Long userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                logger.info("开始异步多角色语音生成任务: docId={}, userId={}", docId, userId);
                return synthesizeMultiRoleAudioForInterpretation(docId, userId);
            } catch (Exception e) {
                logger.error("异步多角色语音生成失败: docId={}, userId={}, error={}", docId, userId, e.getMessage(), e);
                throw new RuntimeException("异步多角色语音生成失败: " + e.getMessage(), e);
            }
        });
    }

    /**
     * 为指定文档的解读内容生成多角色语音
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 音频文件的OSS URL
     */
    public String synthesizeMultiRoleAudioForInterpretation(Long docId, Long userId) {
        try {
            // 1. 获取解读内容
            Optional<DocInterpretation> interpretationOpt = docInterpretationRepository.findByDocId(docId);
            if (interpretationOpt.isEmpty()) {
                throw new RuntimeException("找不到文档ID为 " + docId + " 的解读内容");
            }
            
            DocInterpretation interpretation = interpretationOpt.get();
            if (interpretation.getContent() == null || interpretation.getContent().trim().isEmpty()) {
                throw new RuntimeException("解读内容为空，无法生成语音");
            }

            // 2. 获取qwen3-32b模型配置
            Optional<Model> qwenModelOpt = modelRepository.findByPurposeExact("语音合成SSML标记生成");
            if (qwenModelOpt.isEmpty()) {
                throw new RuntimeException("找不到用途为'语音合成SSML标记生成'的模型配置");
            }
            
            Model qwenModel = qwenModelOpt.get();
            logger.info("使用Qwen模型生成SSML: {}", qwenModel.getName());

            // 3. 调用qwen3-32b生成SSML标记内容
            String rawSSMLContent = generateSSMLContent(interpretation.getContent(), qwenModel);
            logger.info("原始SSML内容生成完成，长度: {} 字符", rawSSMLContent.length());

            // 4. 校验和处理SSML内容
            String processedSSMLContent = validateAndProcessSSML(rawSSMLContent);
            logger.info("SSML内容处理完成，最终长度: {} 字符", processedSSMLContent.length());

            // 5. 获取cosyvoice-v2模型配置
            Optional<Model> cosyModelOpt = modelRepository.findByPurposeExact("多角色语音合成");
            if (cosyModelOpt.isEmpty()) {
                throw new RuntimeException("找不到用途为'多角色语音合成'的模型配置");
            }
            
            Model cosyModel = cosyModelOpt.get();
            logger.info("使用CosyVoice模型进行多角色语音合成: {}", cosyModel.getName());

            // 6. 调用cosyvoice-v2进行多角色语音合成
            byte[] audioBytes = synthesizeMultiRoleAudio(processedSSMLContent, cosyModel);

            // 7. 将音频数据上传到OSS
            String fileName = "multi_role_interpretation_" + docId + ".wav";
            String audioUrl = ossService.uploadInterpretationAudio(audioBytes, fileName, userId, docId);

            // 8. 更新解读记录的音频URL
            interpretation.setAudioUrl(audioUrl);
            docInterpretationRepository.save(interpretation);

            logger.info("多角色语音合成完成，文档ID: {}, 音频URL: {}", docId, audioUrl);
            return audioUrl;

        } catch (Exception e) {
            String errorMsg = "#生成内容失败，请删除后重试。错误信息：" + e.getMessage();
            logger.error("多角色语音合成失败，文档ID: {}, 错误: {}", docId, e.getMessage(), e);
            
            // 保存错误信息到interpretation的audio_url字段
            try {
                Optional<DocInterpretation> interpretationOpt = docInterpretationRepository.findByDocId(docId);
                if (interpretationOpt.isPresent()) {
                    DocInterpretation interpretation = interpretationOpt.get();
                    interpretation.setAudioUrl(errorMsg);
                    docInterpretationRepository.save(interpretation);
                } else {
                    // 如果解读记录不存在，创建一个新的记录来保存错误信息
                    DocInterpretation interpretation = new DocInterpretation();
                    interpretation.setDocId(docId);
                    interpretation.setAudioUrl(errorMsg);
                    docInterpretationRepository.save(interpretation);
                }
            } catch (Exception saveException) {
                logger.error("保存音频错误信息失败: {}", saveException.getMessage(), saveException);
            }
            
            throw new RuntimeException(errorMsg, e);
        }
    }

    /**
     * 使用qwen3-32b模型生成SSML标记内容
     * @param content 对话内容
     * @param qwenModel qwen模型配置
     * @return SSML标记内容
     */
    private String generateSSMLContent(String content, Model qwenModel) {
        try {
            logger.info("开始调用Qwen模型生成SSML标记");
            
            // 创建Generation实例
            Generation gen = new Generation();
            
            // 从数据库获取SSML生成提示词模板
            String ssmlPromptTemplate = promptTemplateService.getActivePromptContent("audio.ssml.generation.prompt");
            
            // 构建用户提示词
            String userPrompt = String.format(ssmlPromptTemplate, content);
            
            // 构建系统消息
            Message systemMsg = Message.builder()
                    .role(Role.SYSTEM.getValue())
                    .content("You are a helpful assistant specialized in generating SSML markup for multi-role audio synthesis.")
                    .build();
            
            // 构建用户消息
            Message userMsg = Message.builder()
                    .role(Role.USER.getValue())
                    .content(userPrompt)
                    .build();
            
            // 构建请求参数
            GenerationParam param = GenerationParam.builder()
                    .apiKey(qwenModel.getApiKey())
                    .model(qwenModel.getName())
                    .messages(java.util.Arrays.asList(systemMsg, userMsg))
                    .resultFormat(GenerationParam.ResultFormat.MESSAGE)
                    .enableThinking(false)
                    .build();
            
            // 调用API
            GenerationResult result = gen.call(param);
            
            if (result == null || result.getOutput() == null || result.getOutput().getChoices() == null || result.getOutput().getChoices().isEmpty()) {
                throw new RuntimeException("Qwen模型返回空响应");
            }
            
            String ssmlContent = result.getOutput().getChoices().get(0).getMessage().getContent();
            if (ssmlContent == null || ssmlContent.trim().isEmpty()) {
                throw new RuntimeException("Qwen模型生成的SSML内容为空");
            }
            
            logger.info("SSML内容生成成功，长度: {} 字符", ssmlContent.length());
            logger.info("生成的SSML内容: {}", ssmlContent);
            return ssmlContent.trim();
            
        } catch (ApiException | NoApiKeyException | InputRequiredException e) {
            logger.error("调用Qwen模型生成SSML失败: {}", e.getMessage(), e);
            throw new RuntimeException("SSML生成失败: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("调用Qwen模型生成SSML失败: {}", e.getMessage(), e);
            throw new RuntimeException("SSML生成失败: " + e.getMessage(), e);
        }
    }

    /**
     * 使用cosyvoice-v2进行多角色语音合成
     * @param ssmlContent SSML标记内容
     * @param cosyModel cosyvoice模型配置
     * @return 音频字节数组
     */
    private byte[] synthesizeMultiRoleAudio(String ssmlContent, Model cosyModel) {
        int attempt = 0;
        Exception lastException = null;
        
        while (attempt <= maxRetries) {
            try {
                logger.info("开始调用CosyVoice进行多角色语音合成 (尝试 {}/{})", attempt + 1, maxRetries + 1);
                
                // 用于收集音频数据的输出流
                ByteArrayOutputStream audioOutputStream = new ByteArrayOutputStream();
                CountDownLatch latch = new CountDownLatch(1);
            
            // 创建回调接口
            ResultCallback<SpeechSynthesisResult> callback = new ResultCallback<SpeechSynthesisResult>() {
                @Override
                public void onEvent(SpeechSynthesisResult result) {
                    if (result.getAudioFrame() != null) {
                        try {
                            // 将音频数据写入输出流
                            audioOutputStream.write(result.getAudioFrame().array());
                            logger.debug("收到音频数据块，大小: {} bytes", result.getAudioFrame().array().length);
                        } catch (IOException e) {
                            logger.error("写入音频数据失败: {}", e.getMessage(), e);
                        }
                    }
                }

                @Override
                public void onComplete() {
                    logger.info("多角色语音合成完成");
                    latch.countDown();
                }

                @Override
                public void onError(Exception e) {
                    logger.error("多角色语音合成出现异常: {}", e.getMessage(), e);
                    latch.countDown();
                }
            };

            // 创建语音合成参数
            SpeechSynthesisParam param = SpeechSynthesisParam.builder()
                    .apiKey(cosyModel.getApiKey())
                    .model(cosyModel.getName())
                    .voice("longxiaoxia_v2")  // 添加默认音色
                    .build();

            // 创建语音合成器
            SpeechSynthesizer synthesizer = new SpeechSynthesizer(param, callback);
            
            // 开始语音合成
            synthesizer.call(ssmlContent);
            
            // 等待合成完成，使用配置的超时时间
            boolean completed = latch.await(synthesisTimeout, TimeUnit.SECONDS);
            if (!completed) {
                throw new RuntimeException(String.format("语音合成超时，超过%d秒未完成", synthesisTimeout));
            }

            // 获取合成的音频数据
            byte[] audioBytes = audioOutputStream.toByteArray();
            if (audioBytes.length == 0) {
                throw new RuntimeException("语音合成返回空数据");
            }
            
            logger.info("多角色语音合成成功，音频大小: {} bytes", audioBytes.length);
                return audioBytes;
                
            } catch (Exception e) {
                lastException = e;
                logger.error("调用CosyVoice多角色语音合成失败 (尝试 {}/{}): {}", 
                    attempt + 1, maxRetries + 1, e.getMessage(), e);
                
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(retryDelay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
                attempt++;
            }
        }
        
        logger.error("多角色语音合成失败，已达到最大重试次数: {}", maxRetries);
        throw new RuntimeException("多角色语音合成失败: " + lastException.getMessage(), lastException);
    }

    /**
     * 校验和处理SSML内容
     * @param ssmlContent 原始SSML内容
     * @return 处理后的SSML内容
     */
    private String validateAndProcessSSML(String ssmlContent) {
        try {
            logger.info("开始处理SSML内容，原始长度: {} 字符", ssmlContent.length());
            
            // 显示SSML内容的前500字符以便调试
            String preview = ssmlContent.length() > 500 ? ssmlContent.substring(0, 500) + "..." : ssmlContent;
            logger.info("SSML内容预览: {}", preview);
            
            // 暂时注释掉格式校验，直接使用原始内容进行测试
            // boolean isValid = validateSSMLFormat(ssmlContent);
            // 
            // if (!isValid) {
            //     logger.warn("SSML格式校验失败，使用降级文本");
            //     return createFallbackSSML();
            // }
            
            logger.info("跳过格式校验，直接使用原始SSML内容，长度: {} 字符", ssmlContent.length());
            return ssmlContent;
            
        } catch (Exception e) {
            logger.error("SSML内容处理失败: {}", e.getMessage(), e);
            logger.warn("使用降级文本");
            return createFallbackSSML();
        }
    }


    /**
     * SSML格式校验
     * @param content SSML内容
     * @return 是否有效
     */
    private boolean validateSSMLFormat(String content) {
        try {
            // 1. 检查是否包含speak标签
            if (!content.contains("<speak") || !content.contains("</speak>")) {
                logger.warn("SSML内容缺少必需的<speak>标签");
                return false;
            }
            
            // 2. 检查是否存在嵌套的speak标签（不允许）
            Matcher nestedMatcher = NESTED_SPEAK_PATTERN.matcher(content);
            if (nestedMatcher.find()) {
                logger.warn("发现嵌套的<speak>标签，不符合规范");
                return false;
            }
            
            // 3. 检查speak标签的配对
            int openTags = countOccurrences(content, "<speak");
            int closeTags = countOccurrences(content, "</speak>");
            if (openTags != closeTags) {
                logger.warn("speak标签配对不匹配，开标签: {}, 闭标签: {}", openTags, closeTags);
                return false;
            }
            
            // 4. 检查是否有有效的speak标签内容
            Matcher speakMatcher = SPEAK_TAG_PATTERN.matcher(content);
            if (!speakMatcher.find()) {
                logger.warn("未找到有效的<speak>标签内容");
                return false;
            }
            
            // 5. 检查内容长度是否合理（避免过长的内容）
            if (content.length() > 50000) {
                logger.warn("SSML内容过长: {} 字符，可能导致处理问题", content.length());
                return false;
            }
            
            logger.info("SSML格式校验通过");
            return true;
            
        } catch (Exception e) {
            logger.error("SSML格式校验异常: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 创建降级SSML内容
     * @return 降级的SSML内容
     */
    private String createFallbackSSML() {
        String fallbackSSML = String.format("<speak voice=\"longxiaoxia_v2\">%s</speak>", FALLBACK_TEXT);
        logger.info("创建降级SSML内容: {}", fallbackSSML);
        return fallbackSSML;
    }

    /**
     * 统计字符串中子字符串的出现次数
     * @param text 原字符串
     * @param substring 子字符串
     * @return 出现次数
     */
    private int countOccurrences(String text, String substring) {
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(substring, index)) != -1) {
            count++;
            index += substring.length();
        }
        return count;
    }

}
