package com.aibuffet.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Set;

@Entity
@Table(name = "models")
public class Model {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(name = "base_url", nullable = false)
    private String baseUrl;

    @Column(name = "api_key", nullable = false)
    private String apiKey;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String purpose;
    private String provider;

    @Column(name = "is_open_source")
    private Boolean isOpenSource;

    @Column(name = "invocation_method")
    private String invocationMethod = "openAPI";

    @Column
    private String emoji;

    @Column(name = "supported_input_types", columnDefinition = "json")
    private Set<String> supportedInputTypes;

    @Column(name = "invoke_config", columnDefinition = "TEXT")
    private String invokeConfig;

    // Getters and Setters
    
    public String getEmoji() {
        return emoji;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public Boolean getIsOpenSource() {
        return isOpenSource;
    }

    public void setIsOpenSource(Boolean isOpenSource) {
        this.isOpenSource = isOpenSource;
    }

    public String getInvocationMethod() {
        return invocationMethod;
    }

    public void setInvocationMethod(String invocationMethod) {
        this.invocationMethod = invocationMethod;
    }

    public Set<String> getSupportedInputTypes() {
        return supportedInputTypes;
    }

    public void setSupportedInputTypes(Set<String> supportedInputTypes) {
        this.supportedInputTypes = supportedInputTypes;
    }

    public String getInvokeConfig() {
        return invokeConfig;
    }

    public void setInvokeConfig(String invokeConfig) {
        this.invokeConfig = invokeConfig;
    }
}