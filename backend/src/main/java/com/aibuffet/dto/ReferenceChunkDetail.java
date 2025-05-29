package com.aibuffet.dto;

public class ReferenceChunkDetail {
    private Long fileId;
    private Integer chunkIndex;
    private String fileName;
    private String content;
    private Float similarity;

    public ReferenceChunkDetail() {}

    public ReferenceChunkDetail(Long fileId, Integer chunkIndex, String fileName, String content, Float similarity) {
        this.fileId = fileId;
        this.chunkIndex = chunkIndex;
        this.fileName = fileName;
        this.content = content;
        this.similarity = similarity;
    }

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public Integer getChunkIndex() {
        return chunkIndex;
    }

    public void setChunkIndex(Integer chunkIndex) {
        this.chunkIndex = chunkIndex;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Float getSimilarity() {
        return similarity;
    }

    public void setSimilarity(Float similarity) {
        this.similarity = similarity;
    }
}
