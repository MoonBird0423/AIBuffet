package com.aibuffet.model;

public enum InputType {
    IMAGE("图片"),
    VIDEO("视频"),
    AUDIO("音频"),
    FILE("文件"),
    TEXT("文本");

    private final String description;

    InputType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}