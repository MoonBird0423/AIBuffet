package com.aibuffet.config;

import io.milvus.v2.client.ConnectConfig;
import io.milvus.v2.client.MilvusClientV2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MilvusConfig {
    private static final Logger logger = LoggerFactory.getLogger(MilvusConfig.class);
    @Value("${milvus.uri:http://localhost:19530}")
    private String uri;
    
    @Value("${milvus.token:root:Milvus}")
    private String token;
    
    @Bean
    public MilvusClientV2 milvusClient() {
        logger.info("Initializing Milvus client with uri: {} and token: {}", uri, token);
        try {
            ConnectConfig connectConfig = ConnectConfig.builder()
                .uri(uri)
                .token(token)
                .build();
            
            logger.debug("Created ConnectConfig: {}", connectConfig);
            MilvusClientV2 client = new MilvusClientV2(connectConfig);
            logger.info("Milvus client created successfully");
            return client;
        } catch (Exception e) {
            logger.error("Failed to create Milvus client", e);
            throw e;
        }
    }
}
