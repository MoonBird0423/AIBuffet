package com.aibuffet.service.impl;

import com.aibuffet.model.UserOrder;
import com.aibuffet.repository.OrderRepository;
import com.aibuffet.service.OrderService;
import com.aibuffet.common.WeChatPayUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final WeChatPayUtil weChatPayUtil;

    @Value("${wechatpay.appid}")
    private String appid;
    @Value("${wechatpay.mchid}")
    private String mchid;
    @Value("${wechatpay.order_expire_minutes:120}")
    private Integer orderExpireMinutes;
    @Value("${wechatpay.merchant_id}")
    private String merchantId;

    public OrderServiceImpl(OrderRepository orderRepository, WeChatPayUtil weChatPayUtil) {
        this.orderRepository = orderRepository;
        this.weChatPayUtil = weChatPayUtil;
    }

    @Override
    @Transactional
    public UserOrder createOrGetOrder(Long userId, String memberType, Integer periodMonths, String payType, Integer amount, String description) {
        // 先查找是否有相同条件的未支付订单
        Optional<UserOrder> existingOrder = orderRepository.findFirstByUserIdAndMemberTypeAndPeriodMonthsAndPayTypeAndPayStatus(
                userId, memberType, periodMonths, payType, "未支付");
        
        if (existingOrder.isPresent()) {
            return existingOrder.get();
        }

        // 生成订单号
        String outTradeNo = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expire = now.plusMinutes(orderExpireMinutes);

        // 调用微信下单接口，获取二维码URL
        String codeUrl = weChatPayUtil.createNativeOrder(appid, mchid, description, outTradeNo, expire, amount);

        // 创建新订单
        UserOrder order = new UserOrder();
        order.setOutTradeNo(outTradeNo);
        order.setUserId(userId);
        order.setDescription(description);
        order.setMemberType(memberType);
        order.setPeriodMonths(periodMonths);
        order.setAmount(amount);
        order.setTimeExpire(expire);
        order.setCreateTime(now);
        order.setPayType(payType);
        order.setPayStatus("未支付");
        order.setMchid(mchid);
        order.setAppid(appid);
        order.setCodeUrl(codeUrl);

        return orderRepository.save(order);
    }

    @Override
    public UserOrder getOrderByOutTradeNo(String outTradeNo) {
        return orderRepository.findByOutTradeNo(outTradeNo).orElse(null);
    }

    @Override
    @Transactional
    public UserOrder updateOrderStatusFromWeChat(String outTradeNo) {
        // 先查本地订单
        UserOrder order = getOrderByOutTradeNo(outTradeNo);
        if (order == null || !"未支付".equals(order.getPayStatus())) {
            return order;
        }

        // 查询微信订单状态
        WeChatPayUtil.OrderStatus status = weChatPayUtil.queryOrderStatus(order.getOutTradeNo(), merchantId);
        if (status != null && "SUCCESS".equals(status.getTradeState())) {
            order.setPayStatus("已支付");
            order.setPayTime(LocalDateTime.now());
            order.setTransactionId(status.getTransactionId());
            orderRepository.save(order);
        }

        return order;
    }

    @Override
    @Transactional
    public void handleWeChatNotify(String notifyBody, String serial, String signature, String timestamp, String nonce) {
        // 验签、解密、更新订单和用户
        WeChatPayUtil.NotifyResult result = weChatPayUtil.parseNotify(notifyBody, serial, signature, timestamp, nonce);
        if (result != null && "SUCCESS".equals(result.getTradeState())) {
            UserOrder order = orderRepository.findByOutTradeNo(result.getOutTradeNo()).orElse(null);
            if (order != null && !"已支付".equals(order.getPayStatus())) {
                order.setPayStatus("已支付");
                order.setPayTime(LocalDateTime.now());
                order.setTransactionId(result.getTransactionId());
                orderRepository.save(order);
                
                // TODO: 更新用户表，添加角色和过期时间
                // 这里需要根据你的用户表结构来实现
            }
        }
    }

    @Override
    public List<UserOrder> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }
} 