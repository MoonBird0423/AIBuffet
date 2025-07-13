package com.aibuffet.config;

import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.RSAAutoCertificateConfig;
import com.wechat.pay.java.core.notification.NotificationConfig;
import com.wechat.pay.java.service.payments.nativepay.NativePayService;
import com.wechat.pay.java.service.payments.nativepay.model.QueryOrderByIdRequest;
import com.wechat.pay.java.service.payments.nativepay.model.QueryOrderByOutTradeNoRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.apache.commons.io.IOUtils;

@Configuration
public class WeChatPayConfig {

    @Value("${wechatpay.merchant_id}")
    private String merchantId;

    @Autowired
    private ResourceLoader resourceLoader;

    @Value("${wechatpay.private_key_path}")
    private String privateKeyPath;

    @Value("${wechatpay.merchant_serial_number}")
    private String merchantSerialNumber;

    @Value("${wechatpay.apiv3_key}")
    private String apiV3Key;

    @Bean
    public RSAAutoCertificateConfig wechatPayConfig() throws IOException {
        Resource resource = resourceLoader.getResource(privateKeyPath);
        try (InputStream inputStream = resource.getInputStream()) {
            String privateKey = IOUtils.toString(inputStream, StandardCharsets.UTF_8);
            return new RSAAutoCertificateConfig.Builder()
                    .merchantId(merchantId)
                    .privateKey(privateKey)
                    .merchantSerialNumber(merchantSerialNumber)
                    .apiV3Key(apiV3Key)
                    .build();
        }
    }

    @Bean
    public NativePayService nativePayService(Config config) {
        return new NativePayService.Builder().config(config).build();
    }

    @Bean
    public NotificationConfig notificationConfig(RSAAutoCertificateConfig config) {
        return config;
    }
}
