package com.aibuffet.model;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class TextChunk {
    private String content;
    private int tokenCount;
    private int startIndex;
    private int endIndex;
    private Map<String, Object> metadata;

    public TextChunk(String content, int tokenCount, int startIndex, int endIndex, Map<String, Object> metadata) {
        this.content = content;
        this.tokenCount = tokenCount;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.metadata = metadata;
    }

    public TextChunk(String content, int tokenCount, int startIndex, int endIndex) {
        this(content, tokenCount, startIndex, endIndex, null);
    }
}
