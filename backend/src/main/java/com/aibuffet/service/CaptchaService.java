package com.aibuffet.service;

import com.aibuffet.dto.CaptchaResponse;
import com.aibuffet.model.CaptchaRecord;
import com.aibuffet.repository.CaptchaRecordRepository;
import com.wf.captcha.SpecCaptcha;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class CaptchaService {

    @Autowired
    private CaptchaRecordRepository captchaRecordRepository;

    @Autowired
    private ObjectFactory<SpecCaptcha> specCaptchaFactory;

    /**
     * 生成验证码
     * @param ipAddress 请求IP地址
     * @return 验证码响应对象，包含验证码ID和图片base64数据
     */
    @Transactional
    public CaptchaResponse generateCaptcha(String ipAddress) {
        // 每次获取新的验证码实例
        SpecCaptcha captcha = specCaptchaFactory.getObject();
        // 生成验证码
        String code = captcha.text().toLowerCase();
        String base64 = captcha.toBase64();
        
        // 生成唯一ID
        String captchaId = UUID.randomUUID().toString();
        
        // 创建验证码记录
        CaptchaRecord record = new CaptchaRecord();
        record.setCaptchaId(captchaId);
        record.setCaptchaCode(code);
        record.setIpAddress(ipAddress);
        record.setStatus(0); // 0表示未使用
        record.setCreatedAt(LocalDateTime.now());
        record.setExpiredAt(LocalDateTime.now().plusMinutes(5)); // 5分钟有效期
        
        // 保存记录
        captchaRecordRepository.save(record);
        
        // 返回响应
        return new CaptchaResponse(captchaId, base64);
    }

    /**
     * 验证图形验证码
     * @param captchaId 验证码ID
     * @param captchaCode 验证码
     * @return 是否验证通过
     */
    @Transactional
    public boolean validateCaptcha(String captchaId, String captchaCode) {
        LocalDateTime now = LocalDateTime.now();
        Optional<CaptchaRecord> recordOpt = captchaRecordRepository.findValidCaptcha(captchaId, captchaCode.toLowerCase(), now);
        return recordOpt.isPresent();
    }

    /**
     * verifyCaptcha 方法是 validateCaptcha 的别名，
     * 用于保持与 VerificationCodeService 的兼容性
     */
    @Transactional
    public boolean verifyCaptcha(String captchaId, String captchaCode) {
        return validateCaptcha(captchaId, captchaCode);
    }
}