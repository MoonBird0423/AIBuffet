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
import com.aliyun.tea.TeaException;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
public class VerificationCodeService {
    private final VerificationCodeRepository verificationCodeRepository;
    private final CaptchaRecordRepository captchaRecordRepository;
    private final Random random = new Random();

    // 直接写死短信签名，避免乱码问题
    private final String signName = "征鸿于野软件开发工作室";

    @Value("${sms.verification-template-code}")
    private String verificationTemplateCode;

    @Value("${sms.endpoint:dysmsapi.aliyuncs.com}")
    private String endpoint;

    @Value("${sms.code-expiration-minutes:5}")
    private int codeExpirationMinutes;

    @Value("${sms.rate-limit-per-minute:3}")
    private int rateLimitPerMinute;

    // 创建阿里云短信客户端
    private Client createClient() throws Exception {
        Config config = new Config()
                .setAccessKeyId(System.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID"))
                .setAccessKeySecret(System.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET"));
        config.endpoint = endpoint;
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
        if (recentCount >= rateLimitPerMinute) {
            System.out.println("发送频率超限 - 最近一分钟发送次数: " + recentCount);
            throw new RuntimeException("短信发送过于频繁，每分钟最多发送" + rateLimitPerMinute + "条，请稍后重试");
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

            // 发送短信前输出签名
            System.out.println("短信签名: " + signName);
            // 发送短信
            Client client = createClient();
            SendSmsRequest sendSmsRequest = new SendSmsRequest()
                    .setSignName(signName)
                    .setTemplateCode(verificationTemplateCode)
                    .setPhoneNumbers(phone)
                    .setTemplateParam("{\"code\":\"" + code + "\"}");
            
            System.out.println("开始调用阿里云短信服务");
            var response = client.sendSmsWithOptions(sendSmsRequest, new com.aliyun.teautil.models.RuntimeOptions());
            // 打印阿里云短信服务返回的详细信息
            var responseBody = response.getBody();
            System.out.println("阿里云短信服务返回: " + responseBody.toString());
            String codeResp = responseBody.getCode();
            String messageResp = responseBody.getMessage();
            String requestId = responseBody.getRequestId();
            String bizId = responseBody.getBizId();
            System.out.println("短信服务返回Code: " + codeResp + ", Message: " + messageResp + ", RequestId: " + requestId + ", BizId: " + bizId);
            if (!"OK".equals(codeResp)) {
                System.out.println("短信服务返回非OK状态，终止流程");
                throw new RuntimeException("短信服务返回异常: " + codeResp + " - " + messageResp);
            }
            System.out.println("阿里云短信服务调用成功");

            // 保存验证码记录
            VerificationCode verificationCode = new VerificationCode();
            verificationCode.setPhone(phone);
            verificationCode.setCode(code);
            // 设置过期时间
            LocalDateTime now = LocalDateTime.now();
            verificationCode.setCreatedAt(now);
            verificationCode.setExpiredAt(now.plusMinutes(codeExpirationMinutes));
            verificationCode.setStatus(0);
            verificationCodeRepository.save(verificationCode);
            System.out.println("验证码记录保存成功，过期时间: " + verificationCode.getExpiredAt());

            // 短信发送成功后，将图形验证码标记为已使用
            CaptchaRecord record = captchaRecord.get();
            record.setStatus(1); // 1表示已使用
            captchaRecordRepository.save(record);
            System.out.println("图形验证码已标记为已使用");

        } catch (Exception e) {
            System.out.println("发送短信失败: " + e.getMessage());
            e.printStackTrace();
            // 如果是阿里云SDK的异常，尝试打印更多信息
            if (e instanceof TeaException) {
                TeaException teaEx = (TeaException) e;
                System.out.println("阿里云SDK异常Code: " + teaEx.getCode());
                System.out.println("阿里云SDK异常Message: " + teaEx.getMessage());
                System.out.println("阿里云SDK异常Data: " + teaEx.getData());
            }
            throw new RuntimeException(ErrorCode.SMS_SEND_FAILED.getMessage());
        }
    }

    // 验证验证码
    public boolean verifyCode(String phone, String code) {
        System.out.println("开始验证短信验证码 - phone: " + phone);
        
        if (phone == null || code == null) {
            System.out.println("验证失败：手机号或验证码为空");
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        System.out.println("当前时间: " + now);
        
        return verificationCodeRepository.findValidCode(
            phone, 
            code, 
            now
        ).map(record -> {
            System.out.println("找到验证码记录:");
            System.out.println("- 创建时间: " + record.getCreatedAt());
            System.out.println("- 过期时间: " + record.getExpiredAt());
            System.out.println("- 当前状态: " + (record.getStatus() == 0 ? "未使用" : "已使用"));
            
            if (record.getStatus() != 0) {
                System.out.println("验证失败：验证码已被使用");
                return false;
            }
            
            if (now.isAfter(record.getExpiredAt())) {
                System.out.println("验证失败：验证码已过期");
                return false;
            }
            
            System.out.println("验证通过，标记验证码为已使用");
            record.setStatus(1); // 标记为已使用
            verificationCodeRepository.save(record);
            return true;
        }).orElseGet(() -> {
            System.out.println("验证失败：未找到匹配的有效验证码记录");
            return false;
        });
    }
}
