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
        try {
            System.out.println("正在创建SpecCaptcha实例...");
            // 每次请求创建新的验证码实例
            SpecCaptcha specCaptcha = new SpecCaptcha(130, 48);
            
            // 设置字体
            java.awt.Font font = new java.awt.Font("Verdana", java.awt.Font.PLAIN, 32);
            specCaptcha.setFont(font);
            
            // 设置字符数量
            specCaptcha.setLen(4);
            
            // 设置字符类型：数字和字母组合
            specCaptcha.setCharType(SpecCaptcha.TYPE_DEFAULT);
            
            System.out.println("SpecCaptcha实例创建成功");
            return specCaptcha;
        } catch (Exception e) {
            System.err.println("SpecCaptcha创建失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("验证码组件初始化失败", e);
        }
    }
}
