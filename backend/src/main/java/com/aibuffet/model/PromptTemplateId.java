package com.aibuffet.model;

import java.io.Serializable;
import java.util.Objects;

/**
 * 提示词模板复合主键
 */
public class PromptTemplateId implements Serializable {
    private String name;
    private Integer version;

    public PromptTemplateId() {
    }

    public PromptTemplateId(String name, Integer version) {
        this.name = name;
        this.version = version;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PromptTemplateId that = (PromptTemplateId) o;
        return Objects.equals(name, that.name) && Objects.equals(version, that.version);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, version);
    }

    @Override
    public String toString() {
        return "PromptTemplateId{" +
                "name='" + name + '\'' +
                ", version=" + version +
                '}';
    }
}
