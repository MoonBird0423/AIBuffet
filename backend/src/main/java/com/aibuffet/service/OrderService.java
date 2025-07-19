package com.aibuffet.service;

import com.aibuffet.model.UserOrder;
import org.springframework.data.domain.Page;

import java.util.List;

public interface OrderService {
    UserOrder createOrGetOrder(Long userId, String memberType, Integer periodMonths, String payType, Integer amount, String description);

    UserOrder getOrderByOutTradeNo(String outTradeNo);

    UserOrder updateOrderStatusFromWeChat(String outTradeNo);

    void handleWeChatNotify(String notifyBody, String serial, String signature, String timestamp, String nonce);

    List<UserOrder> getUserOrders(Long userId);

    Page<UserOrder> getUserOrders(Long userId, int page, int size);
}
