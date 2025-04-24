package com.aibuffet.config;

import io.milvus.v2.client.ConnectConfig;
import io.milvus.v2.client.MilvusClientV2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MilvusConfig {
    @Value("${milvus.uri:http://localhost:19530}")
    private String uri;
    
    @Value("${milvus.token:root:Milvus}")
    private String token;
    
    @Bean
    public MilvusClientV2 milvusClient() {
        ConnectConfig connectConfig = ConnectConfig.builder()
            .uri(uri)
            .token(token)
            .build();
        
        return new MilvusClientV2(connectConfig);
    }
}
