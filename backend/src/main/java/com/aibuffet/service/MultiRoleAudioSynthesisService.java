package com.aibuffet.service;

import com.alibaba.dashscope.audio.tts.SpeechSynthesisResult;
import com.alibaba.dashscope.audio.ttsv2.SpeechSynthesisParam;
import com.alibaba.dashscope.audio.ttsv2.SpeechSynthesizer;
import com.alibaba.dashscope.common.ResultCallback;
import com.aibuffet.model.Model;
import com.aibuffet.model.DocInterpretation;
import com.aibuffet.repository.ModelRepository;
import com.aibuffet.repository.DocInterpretationRepository;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

@Service
public class MultiRoleAudioSynthesisService {
    private static final Logger logger = LoggerFactory.getLogger(MultiRoleAudioSynthesisService.class);
    
    @Autowired
    private ModelRepository modelRepository;
    
    @Autowired
    private DocInterpretationRepository docInterpretationRepository;
    
    @Autowired
    private OSSService ossService;
    
    @Autowired
    private DocumentService documentService;

    // 固定的SSML生成提示词
    private static final String SSML_PROMPT_TEMPLATE = """
        请将下面的对话转换成阿里云CosyVoice大模型的SSML标记语言（基于W3C的语音合成标记语言版本1.0）让对话的每个角色都有不同的音色。
        可使用标签：
        1、<speak>标签是所有待支持SSML标签的根节点。一切需要调用SSML标签的文本都要包含在<speak></speak>中；
        2、<break>用于在文本中插入停顿，该标签是可选标签；
        3、<phoneme>用于控制标签内文本的读音，该标签是可选标签；
        4、<say-as>用于指示出标签内文本的信息类型，进而按照该类型的默认发音方式发音；
        使用例子：
        <speak><say-as interpret-as="telephone">114</say-as>查询号码 <say-as interpret-as="cardinal">123</say-as>开始干。加起来为<say-as interpret-as="digits">1234</say-as>。<say-as interpret-as="name">张三</say-as>的快递。<say-as interpret-as="address">富路国际1号楼3单元304</say-as><say-as interpret-as="nick">李四6689</say-as></speak>
        角色音色选择指南：（通过<speak>标签属性voice来指定）
        -longxiaoxia_v2：适合主持人
        -longxiang：适合会议男嘉宾
        -longxiaobai：适合会议女嘉宾
        -longyuan：适合观众代表
        特别注意：
        -除了转换内容不要输出其他内容，需要保证输出内容可直接CosyVoice大模型识别。
        -对话流畅，信息完整。
        对话内容
        %s
        """;

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
            String ssmlContent = generateSSMLContent(interpretation.getContent(), qwenModel);
            logger.info("SSML内容生成完成，长度: {} 字符", ssmlContent.length());

            // 4. 获取cosyvoice-v2模型配置
            Optional<Model> cosyModelOpt = modelRepository.findByPurposeExact("多角色语音合成");
            if (cosyModelOpt.isEmpty()) {
                throw new RuntimeException("找不到用途为'多角色语音合成'的模型配置");
            }
            
            Model cosyModel = cosyModelOpt.get();
            logger.info("使用CosyVoice模型进行多角色语音合成: {}", cosyModel.getName());

            // 5. 调用cosyvoice-v2进行多角色语音合成
            byte[] audioBytes = synthesizeMultiRoleAudio(ssmlContent, cosyModel);

            // 6. 将音频数据上传到OSS
            String fileName = "multi_role_interpretation_" + docId + ".wav";
            String audioUrl = ossService.uploadInterpretationAudio(audioBytes, fileName, userId, docId);

            // 7. 更新解读记录的音频URL
            interpretation.setAudioUrl(audioUrl);
            docInterpretationRepository.save(interpretation);

            logger.info("多角色语音合成完成，文档ID: {}, 音频URL: {}", docId, audioUrl);
            return audioUrl;

        } catch (Exception e) {
            logger.error("多角色语音合成失败，文档ID: {}, 错误: {}", docId, e.getMessage(), e);
            throw new RuntimeException("多角色语音合成失败: " + e.getMessage(), e);
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
            
            // 构建OpenAI客户端
            OpenAIClient client = OpenAIOkHttpClient.builder()
                    .apiKey(qwenModel.getApiKey())
                    .baseUrl(qwenModel.getBaseUrl())
                    .build();

            // 构建用户提示词
            String userPrompt = String.format(SSML_PROMPT_TEMPLATE, content);
            
            // 创建聊天完成请求
            ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
                    .addUserMessage(userPrompt)
                    .model(qwenModel.getName())
                    .build();

            // 调用API
            ChatCompletion chatCompletion = client.chat().completions().create(params);
            
            if (chatCompletion.choices().isEmpty()) {
                throw new RuntimeException("Qwen模型返回空响应");
            }
            
            String ssmlContent = chatCompletion.choices().get(0).message().content().orElse("");
            if (ssmlContent.trim().isEmpty()) {
                throw new RuntimeException("Qwen模型生成的SSML内容为空");
            }
            
            logger.info("SSML内容生成成功，长度: {} 字符", ssmlContent.length());
            return ssmlContent.trim();
            
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
        try {
            logger.info("开始调用CosyVoice进行多角色语音合成");
            
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
                    .build();

            // 创建语音合成器
            SpeechSynthesizer synthesizer = new SpeechSynthesizer(param, callback);
            
            // 开始语音合成
            synthesizer.call(ssmlContent);
            
            // 等待合成完成，最多等待5分钟
            boolean completed = latch.await(5, TimeUnit.MINUTES);
            if (!completed) {
                throw new RuntimeException("语音合成超时，超过5分钟未完成");
            }

            // 获取合成的音频数据
            byte[] audioBytes = audioOutputStream.toByteArray();
            if (audioBytes.length == 0) {
                throw new RuntimeException("语音合成返回空数据");
            }
            
            logger.info("多角色语音合成成功，音频大小: {} bytes", audioBytes.length);
            return audioBytes;
            
        } catch (Exception e) {
            logger.error("调用CosyVoice多角色语音合成失败: {}", e.getMessage(), e);
            throw new RuntimeException("多角色语音合成失败: " + e.getMessage(), e);
        }
    }

}
