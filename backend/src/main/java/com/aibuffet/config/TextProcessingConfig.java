package com.aibuffet.config;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TextProcessingConfig {
    
    @Value("${text.processing.chunk.max-tokens:512}")
    private int maxTokensPerChunk;

    @Value("${text.processing.chunk.overlap:50}")
    private int chunkOverlap;

    @Bean
    public Tika tika() {
        return new Tika();
    }

    @Bean
    public TextProcessingProperties textProcessingProperties() {
        return new TextProcessingProperties(maxTokensPerChunk, chunkOverlap);
    }
}
