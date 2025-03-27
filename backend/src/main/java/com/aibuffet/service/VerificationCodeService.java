package com.aibuffet.service;

import com.aibuffet.common.ErrorCode;
import com.aibuffet.model.VerificationCode;
import com.aibuffet.model.CaptchaRecord;
import com.aibuffet.repository.VerificationCodeRepository;
import com.aibuffet.repository.CaptchaRecordRepository;
import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.teaopenapi.models.Config;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VerificationCodeService {
    private final VerificationCodeRepository verificationCodeRepository;
    private final CaptchaRecordRepository captchaRecordRepository;
    private static final int SMS_RATE_LIMIT_PER_MINUTE = 1;
    private final Random random = new Random();

    // 创建阿里云短信客户端
    private Client createClient() throws Exception {
        Config config = new Config()
                .setAccessKeyId(System.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID"))
                .setAccessKeySecret(System.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET"));
        config.endpoint = "dysmsapi.aliyuncs.com";
        return new Client(config);
    }

    // 生成6位随机验证码
    private String generateCode() {
        return String.format("%04d", random.nextInt(10000));
    }

    // 发送验证码
    @Transactional
    public void sendCode(String phone, String captchaId, String captchaCode) {
        System.out.println("开始验证图形验证码 - captchaId: " + captchaId);
        
        // 获取并验证图形验证码
        Optional<CaptchaRecord> captchaRecord = captchaRecordRepository.findValidCaptcha(
            captchaId,
            captchaCode.toLowerCase(),
            LocalDateTime.now()
        );
        
        if (captchaRecord.isEmpty()) {
            System.out.println("图形验证码验证失败");
            throw new RuntimeException(ErrorCode.CAPTCHA_INVALID.getMessage());
        }
        System.out.println("图形验证码验证通过");

        // 检查发送频率
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
        long recentCount = verificationCodeRepository.countRecentCodes(phone, oneMinuteAgo);
        System.out.println("最近一分钟发送次数: " + recentCount);
        if (recentCount >= SMS_RATE_LIMIT_PER_MINUTE) {
            System.out.println("发送频率超限");
            throw new RuntimeException(ErrorCode.SMS_RATE_LIMIT.getMessage());
        }

        // 生成验证码
        String code = generateCode();
        System.out.println("生成验证码: " + code);

        try {
            System.out.println("准备发送短信 - 检查环境变量");
            String accessKeyId = System.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID");
            String accessKeySecret = System.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET");
            System.out.println("AccessKeyId是否存在: " + (accessKeyId != null));
            System.out.println("AccessKeySecret是否存在: " + (accessKeySecret != null));

            // 发送短信
            Client client = createClient();
            SendSmsRequest sendSmsRequest = new SendSmsRequest()
                    .setSignName("阿里云短信测试")
                    .setTemplateCode("SMS_154950909")
                    .setPhoneNumbers(phone)
                    .setTemplateParam("{\"code\":\"" + code + "\"}");
            
            System.out.println("开始调用阿里云短信服务");
            client.sendSmsWithOptions(sendSmsRequest, new com.aliyun.teautil.models.RuntimeOptions());
            System.out.println("阿里云短信服务调用成功");

            // 保存验证码记录
            VerificationCode verificationCode = new VerificationCode();
            verificationCode.setPhone(phone);
            verificationCode.setCode(code);
            verificationCodeRepository.save(verificationCode);
            System.out.println("验证码记录保存成功");

            // 短信发送成功后，将图形验证码标记为已使用
            CaptchaRecord record = captchaRecord.get();
            record.setStatus(1); // 1表示已使用
            captchaRecordRepository.save(record);
            System.out.println("图形验证码已标记为已使用");

        } catch (Exception e) {
            System.out.println("发送短信失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(ErrorCode.SMS_SEND_FAILED.getMessage());
        }
    }

    // 验证验证码
    public boolean verifyCode(String phone, String code) {
        if (phone == null || code == null) {
            return false;
        }

        return verificationCodeRepository.findValidCode(
            phone, 
            code, 
            LocalDateTime.now()
        ).map(record -> {
            record.setStatus(1); // 标记为已使用
            verificationCodeRepository.save(record);
            return true;
        }).orElse(false);
    }
}