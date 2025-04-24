package com.aibuffet.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "text.processing")
@Validated
@Getter
public class TextProcessingProperties {
    @NotNull
    @Min(100)
    @Max(2048)
    private final int maxTokensPerChunk;

    @NotNull
    @Min(0)
    @Max(200)
    private final int chunkOverlap;

    public TextProcessingProperties(int maxTokensPerChunk, int chunkOverlap) {
        this.maxTokensPerChunk = maxTokensPerChunk;
        this.chunkOverlap = chunkOverlap;
    }
}
