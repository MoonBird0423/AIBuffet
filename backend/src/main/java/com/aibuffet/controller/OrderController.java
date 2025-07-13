package com.aibuffet.controller;

import com.aibuffet.model.UserOrder;
import com.aibuffet.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    /**
     * 创建/获取订单
     */
    @PostMapping("/create")
    public UserOrder createOrder(@RequestBody CreateOrderRequest request) {
        return orderService.createOrGetOrder(
                request.getUserId(), 
                request.getMemberType(), 
                request.getPeriodMonths(), 
                request.getPayType(), 
                request.getAmount(), 
                request.getDescription()
        );
    }

    /**
     * 查询订单状态（前端轮询用）
     */
    @GetMapping("/status/{outTradeNo}")
    public UserOrder getOrderStatus(@PathVariable String outTradeNo) {
        return orderService.updateOrderStatusFromWeChat(outTradeNo);
    }

    /**
     * 微信支付回调
     */
    @PostMapping("/notify")
    public String wechatNotify(@RequestBody String body,
                               @RequestHeader("Wechatpay-Serial") String serial,
                               @RequestHeader("Wechatpay-Signature") String signature,
                               @RequestHeader("Wechatpay-Timestamp") String timestamp,
                               @RequestHeader("Wechatpay-Nonce") String nonce) {
        try {
            orderService.handleWeChatNotify(body, serial, signature, timestamp, nonce);
            return ""; // 返回空字符串，HTTP状态码200
        } catch (Exception e) {
            // 处理失败，返回错误状态码
            throw new RuntimeException("处理微信支付回调失败", e);
        }
    }

    /**
     * 查询用户所有订单
     */
    @GetMapping("/list")
    public List<UserOrder> getUserOrders(@RequestParam Long userId) {
        return orderService.getUserOrders(userId);
    }

    /**
     * 创建订单请求DTO
     */
    public static class CreateOrderRequest {
        private Long userId;
        private String memberType;
        private Integer periodMonths;
        private String payType;
        private Integer amount;
        private String description;

        // Getters and Setters
        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
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

        public String getPayType() {
            return payType;
        }

        public void setPayType(String payType) {
            this.payType = payType;
        }

        public Integer getAmount() {
            return amount;
        }

        public void setAmount(Integer amount) {
            this.amount = amount;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
} 