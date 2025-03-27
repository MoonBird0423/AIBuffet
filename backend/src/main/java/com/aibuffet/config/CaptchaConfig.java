package com.aibuffet.config;

import com.wf.captcha.SpecCaptcha;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class CaptchaConfig {
    
    @Bean
    @Scope("prototype")
    public SpecCaptcha specCaptcha() {
        // 每次请求创建新的验证码实例
        SpecCaptcha specCaptcha = new SpecCaptcha(130, 48);
        // 设置字体
        specCaptcha.setFont(new java.awt.Font("Verdana", java.awt.Font.PLAIN, 32));
        // 设置字符数量
        specCaptcha.setLen(4);
        // 设置字符类型：数字和字母组合
        specCaptcha.setCharType(SpecCaptcha.TYPE_DEFAULT);
        return specCaptcha;
    }
}