package com.aibuffet.dto;

public class MessageReference {
    private Long fileId;
    private Integer chunkIndex;
    private String fileName;
    private Float similarity;

    public MessageReference() {}

    public MessageReference(Long fileId, Integer chunkIndex, String fileName, Float similarity) {
        this.fileId = fileId;
        this.chunkIndex = chunkIndex;
        this.fileName = fileName;
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

    public Float getSimilarity() {
        return similarity;
    }

    public void setSimilarity(Float similarity) {
        this.similarity = similarity;
    }
}
