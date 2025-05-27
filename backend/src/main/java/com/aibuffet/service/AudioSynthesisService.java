package com.aibuffet.service;

import com.alibaba.dashscope.audio.tts.SpeechSynthesizer;
import com.alibaba.dashscope.audio.tts.SpeechSynthesisParam;
import com.alibaba.dashscope.audio.tts.SpeechSynthesisAudioFormat;
import com.aibuffet.model.Model;
import com.aibuffet.model.DocInterpretation;
import com.aibuffet.repository.ModelRepository;
import com.aibuffet.repository.DocInterpretationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.ByteBuffer;
import java.util.Optional;

@Service
public class AudioSynthesisService {
    private static final Logger logger = LoggerFactory.getLogger(AudioSynthesisService.class);
    
    @Autowired
    private ModelRepository modelRepository;
    
    @Autowired
    private DocInterpretationRepository docInterpretationRepository;
    
    @Autowired
    private OSSService ossService;

    /**
     * 为指定文档的解读内容生成音频
     * @param docId 文档ID
     * @param userId 用户ID
     * @return 音频文件的OSS URL
     */
    public String synthesizeAudioForInterpretation(Long docId, Long userId) {
        try {
            // 1. 获取解读内容
            Optional<DocInterpretation> interpretationOpt = docInterpretationRepository.findByDocId(docId);
            if (interpretationOpt.isEmpty()) {
                throw new RuntimeException("找不到文档ID为 " + docId + " 的解读内容");
            }
            
            DocInterpretation interpretation = interpretationOpt.get();
            if (interpretation.getContent() == null || interpretation.getContent().trim().isEmpty()) {
                throw new RuntimeException("解读内容为空，无法生成音频");
            }

            // 2. 获取语言合成模型配置
            Optional<Model> modelOpt = modelRepository.findByPurposeExact("语音合成");
            if (modelOpt.isEmpty()) {
                throw new RuntimeException("找不到用途为'语音合成'的模型配置");
            }
            
            Model model = modelOpt.get();
            logger.info("使用模型进行音频合成: {}", model.getName());

            // 3. 预处理解读内容
            String cleanContent = preprocessContent(interpretation.getContent());
            logger.info("预处理后的内容长度: {} 字符", cleanContent.length());

            // 4. 调用DashScope进行音频合成
            ByteBuffer audioBuffer = synthesizeAudio(model, cleanContent);

            // 5. 将音频数据上传到OSS
            String audioUrl = uploadAudioToOSS(audioBuffer, docId, userId);

            // 6. 更新解读记录的音频URL
            interpretation.setAudioUrl(audioUrl);
            docInterpretationRepository.save(interpretation);

            logger.info("音频合成完成，文档ID: {}, 音频URL: {}", docId, audioUrl);
            return audioUrl;

        } catch (Exception e) {
            logger.error("音频合成失败，文档ID: {}, 错误: {}", docId, e.getMessage(), e);
            throw new RuntimeException("音频合成失败: " + e.getMessage(), e);
        }
    }

    /**
     * 预处理解读内容，去除markdown标记和多余空白
     */
    private String preprocessContent(String content) {
        if (content == null) {
            return "";
        }

        return content
                // 去除markdown标题标记
                .replaceAll("#+\\s*", "")
                // 去除粗体标记
                .replaceAll("\\*\\*(.+?)\\*\\*", "$1")
                // 去除斜体标记
                .replaceAll("\\*(.+?)\\*", "$1")
                // 去除列表标记
                .replaceAll("^[-*+]\\s+", "")
                // 去除有序列表标记
                .replaceAll("^\\d+\\.\\s+", "")
                // 去除引用标记
                .replaceAll("^>\\s*", "")
                // 去除代码块标记
                .replaceAll("```[\\s\\S]*?```", "")
                // 去除行内代码标记
                .replaceAll("`(.+?)`", "$1")
                // 去除链接标记，保留链接文本
                .replaceAll("\\[([^\\]]+)\\]\\([^)]+\\)", "$1")
                // 合并多个空白字符为单个空格
                .replaceAll("\\s+", " ")
                // 去除首尾空白
                .trim();
    }

    /**
     * 调用DashScope API进行音频合成
     */
    private ByteBuffer synthesizeAudio(Model model, String text) {
        try {
            SpeechSynthesizer synthesizer = new SpeechSynthesizer();
            SpeechSynthesisParam param = SpeechSynthesisParam.builder()
                    .apiKey(model.getApiKey())
                    .model(model.getName())
                    .text(text)
                    .sampleRate(48000)
                    .format(SpeechSynthesisAudioFormat.WAV)
                    .build();

            logger.info("开始调用DashScope音频合成API");
            ByteBuffer audio = synthesizer.call(param);
            
            if (audio == null || audio.remaining() == 0) {
                throw new RuntimeException("音频合成返回空数据");
            }
            
            logger.info("音频合成成功，数据大小: {} bytes", audio.remaining());
            return audio;
            
        } catch (Exception e) {
            logger.error("调用DashScope音频合成API失败: {}", e.getMessage(), e);
            throw new RuntimeException("音频合成API调用失败: " + e.getMessage(), e);
        }
    }

    /**
     * 将音频数据上传到OSS
     */
    private String uploadAudioToOSS(ByteBuffer audioBuffer, Long docId, Long userId) throws IOException {
        try {
            // 将ByteBuffer转换为byte数组
            byte[] audioBytes = new byte[audioBuffer.remaining()];
            audioBuffer.get(audioBytes);
            
            // 创建临时文件名
            String fileName = "interpretation_" + docId + ".wav";
            
            // 直接使用字节数组上传到OSS
            return ossService.uploadInterpretationAudio(audioBytes, fileName, userId, docId);
            
        } catch (Exception e) {
            logger.error("上传音频文件到OSS失败: {}", e.getMessage(), e);
            throw new IOException("音频文件上传失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取指定文档的音频URL
     */
    public String getAudioUrl(Long docId) {
        Optional<DocInterpretation> interpretationOpt = docInterpretationRepository.findByDocId(docId);
        return interpretationOpt.map(DocInterpretation::getAudioUrl).orElse(null);
    }

    /**
     * 检查指定文档是否已有音频
     */
    public boolean hasAudio(Long docId) {
        String audioUrl = getAudioUrl(docId);
        return audioUrl != null && !audioUrl.trim().isEmpty();
    }
}
