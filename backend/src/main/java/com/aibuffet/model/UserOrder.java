package com.aibuffet.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_order")
public class UserOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "out_trade_no", unique = true, nullable = false, length = 32)
    private String outTradeNo;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 128)
    private String description;

    @Column(name = "member_type", nullable = false, length = 16)
    private String memberType;

    @Column(name = "period_months", nullable = false)
    private Integer periodMonths;

    @Column(nullable = false)
    private Integer amount;

    @Column(name = "time_expire", nullable = false)
    private LocalDateTime timeExpire;

    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    @Column(name = "pay_time")
    private LocalDateTime payTime;

    @Column(name = "pay_type", nullable = false, length = 16)
    private String payType;

    @Column(name = "pay_status", nullable = false, length = 16)
    private String payStatus;

    @Column(nullable = false, length = 32)
    private String mchid;

    @Column(nullable = false, length = 32)
    private String appid;

    @Column(name = "transaction_id", length = 64)
    private String transactionId;

    @Column(name = "code_url", length = 256)
    private String codeUrl;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOutTradeNo() {
        return outTradeNo;
    }

    public void setOutTradeNo(String outTradeNo) {
        this.outTradeNo = outTradeNo;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMemberType() {
        return memberType;
    }

    public void setMemberType(String memberType) {
        this.memberType = memberType;
    }

    public Integer getPeriodMonths() {
        return periodMonths;
    }

    public void setPeriodMonths(Integer periodMonths) {
        this.periodMonths = periodMonths;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public LocalDateTime getTimeExpire() {
        return timeExpire;
    }

    public void setTimeExpire(LocalDateTime timeExpire) {
        this.timeExpire = timeExpire;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getPayTime() {
        return payTime;
    }

    public void setPayTime(LocalDateTime payTime) {
        this.payTime = payTime;
    }

    public String getPayType() {
        return payType;
    }

    public void setPayType(String payType) {
        this.payType = payType;
    }

    public String getPayStatus() {
        return payStatus;
    }

    public void setPayStatus(String payStatus) {
        this.payStatus = payStatus;
    }

    public String getMchid() {
        return mchid;
    }

    public void setMchid(String mchid) {
        this.mchid = mchid;
    }

    public String getAppid() {
        return appid;
    }

    public void setAppid(String appid) {
        this.appid = appid;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getCodeUrl() {
        return codeUrl;
    }

    public void setCodeUrl(String codeUrl) {
        this.codeUrl = codeUrl;
    }
} 