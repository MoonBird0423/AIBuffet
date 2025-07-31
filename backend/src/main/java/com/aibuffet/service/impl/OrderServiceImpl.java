package com.aibuffet.service.impl;

import com.aibuffet.model.UserOrder;
import com.aibuffet.model.User;
import com.aibuffet.repository.OrderRepository;
import com.aibuffet.repository.UserRepository;
import com.aibuffet.repository.RoleRepository;
import com.aibuffet.service.OrderService;
import com.aibuffet.common.WeChatPayUtil;
import com.aibuffet.common.BenefitException;
import com.aibuffet.common.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final WeChatPayUtil weChatPayUtil;

    @Value("${wechatpay.appid}")
    private String appid;
    @Value("${wechatpay.mchid}")
    private String mchid;
    @Value("${wechatpay.order_expire_minutes:120}")
    private Integer orderExpireMinutes;
    @Value("${wechatpay.merchant_id}")
    private String merchantId;

    public OrderServiceImpl(OrderRepository orderRepository, UserRepository userRepository, RoleRepository roleRepository, WeChatPayUtil weChatPayUtil) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.weChatPayUtil = weChatPayUtil;
    }

    @Override
    @Transactional
    public UserOrder createOrGetOrder(Long userId, String memberType, Integer periodMonths, String payType, Integer amount, String description) {

        // 检查会员类型是否存在
        com.aibuffet.model.Role role = roleRepository.findByName(memberType);
        if (role == null) {
            throw new BenefitException(ErrorCode.RESOURCE_NOT_FOUND, "会员不存在");
        }
        /**
        // 检查用户会员状态
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BenefitException(ErrorCode.RESOURCE_NOT_FOUND, "用户不存在"));
        if (user.getRoleId() != null && user.getRoleId() != 0L) {
            if (user.getExpireTime() != null && user.getExpireTime().isAfter(LocalDateTime.now())) {
                throw new BenefitException(ErrorCode.MEMBER_ALREADY_EXISTS, ErrorCode.MEMBER_ALREADY_EXISTS.getMessage());
            }
        }
        */

        // 查找是否有相同条件的未支付订单
        Optional<UserOrder> existingOrder = orderRepository.findFirstByUserIdAndMemberTypeAndPeriodMonthsAndPayTypeAndPayStatus(
                userId, memberType, periodMonths, payType, "未支付");
        
        if (existingOrder.isPresent()) {
            UserOrder order = existingOrder.get();
            // 检查订单是否过期
            if (LocalDateTime.now().isAfter(order.getTimeExpire())) {
                orderRepository.delete(order);
            } else {
                return order;
            }
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

    private void updateUserRoleAfterPayment(UserOrder order) {
        // 只负责角色和过期时间处理
        String memberType = order.getMemberType();
        com.aibuffet.model.Role role = roleRepository.findByName(memberType);
        if (role == null) {
            throw new BenefitException(ErrorCode.RESOURCE_NOT_FOUND, "未找到对应角色: " + memberType);
        }
        User user = userRepository.findById(order.getUserId())
                .orElseThrow(() -> new BenefitException(ErrorCode.RESOURCE_NOT_FOUND, "用户不存在"));
        user.setRoleId(role.getId());
        user.setExpireTime(LocalDateTime.now().plusMonths(order.getPeriodMonths()));
        userRepository.save(user);
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
            // 新增：支付成功后设置用户角色
            updateUserRoleAfterPayment(order);
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
                // 新增：支付成功后设置用户角色
                updateUserRoleAfterPayment(order);
            }
        }
    }

    @Override
    public List<UserOrder> getUserOrders(Long userId, String payStatus) {
        if (payStatus != null) {
            return orderRepository.findByUserIdAndPayStatusOrderByCreateTimeDesc(userId, payStatus);
        }
        return orderRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    @Override
    public Page<UserOrder> getUserOrders(Long userId, String payStatus, int page, int size) {
        if (payStatus != null) {
            return orderRepository.findByUserIdAndPayStatusOrderByCreateTimeDesc(
                userId, payStatus, PageRequest.of(page, size));
        }
        return orderRepository.findByUserIdOrderByCreateTimeDesc(userId, PageRequest.of(page, size));
    }
}
