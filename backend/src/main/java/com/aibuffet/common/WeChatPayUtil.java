package com.aibuffet.common;

import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.notification.NotificationParser;
import com.wechat.pay.java.core.notification.RequestParam;
import com.wechat.pay.java.core.notification.NotificationConfig;
import com.wechat.pay.java.service.payments.nativepay.NativePayService;
import com.wechat.pay.java.service.payments.nativepay.model.*;
import com.wechat.pay.java.core.exception.ServiceException;
import com.wechat.pay.java.service.payments.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class WeChatPayUtil {

    @Autowired
    private NativePayService nativePayService;

    @Autowired
    private Config wechatPayConfig;

    @Autowired
    private NotificationConfig notificationConfig;

    @Value("${wechatpay.appid}")
    private String appid;

    @Value("${wechatpay.mchid}")
    private String mchid;

    @Value("${wechatpay.notify_url}")
    private String notifyUrl;

    @Value("${wechatpay.order_expire_minutes:120}")
    private Integer orderExpireMinutes;

    /**
     * 创建Native支付订单
     */
    public String createNativeOrder(String appid, String mchid, String description, String outTradeNo, 
                                   LocalDateTime timeExpire, Integer amount) {
        try {
            PrepayRequest request = new PrepayRequest();
            
            // 设置金额
            Amount amountObj = new Amount();
            amountObj.setTotal(amount);
            amountObj.setCurrency("CNY");
            request.setAmount(amountObj);
            
            // 设置基本信息
            request.setAppid(appid);
            request.setMchid(mchid);
            request.setDescription(description);
            request.setOutTradeNo(outTradeNo);
            request.setNotifyUrl(notifyUrl);
            
            // 设置过期时间
            request.setTimeExpire(timeExpire.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'+08:00'")));
            
            // 调用微信支付API
            PrepayResponse response = nativePayService.prepay(request);
            return response.getCodeUrl();
        } catch (ServiceException e) {
            throw new RuntimeException("创建微信支付订单失败: " + e.getErrorCode() + " - " + e.getErrorMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("创建微信支付订单失败", e);
        }
    }

    /**
     * 查询订单状态
     */
    public OrderStatus queryOrderStatus(String outTradeNo, String mchid) {
        try {
            QueryOrderByOutTradeNoRequest request = new QueryOrderByOutTradeNoRequest();
            request.setOutTradeNo(outTradeNo);
            request.setMchid(mchid);
            
            Transaction transaction = nativePayService.queryOrderByOutTradeNo(request);
            
            OrderStatus status = new OrderStatus();
            status.setTradeState(transaction.getTradeState().name());
            status.setTransactionId(transaction.getTransactionId());
            
            return status;
        } catch (ServiceException e) {
            // 如果订单不存在，返回null
            if ("ORDER_NOT_EXISTS".equals(e.getErrorCode())) {
                return null;
            }
            throw new RuntimeException("查询订单状态失败: " + e.getErrorCode() + " - " + e.getErrorMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("查询订单状态失败", e);
        }
    }

    /**
     * 解析微信支付回调
     */
    public NotifyResult parseNotify(String notifyBody, String serial, String signature, 
                                   String timestamp, String nonce) {
        try {
            // 构建请求参数
            RequestParam requestParam = new RequestParam.Builder()
                    .serialNumber(serial)
                    .nonce(nonce)
                    .signature(signature)
                    .timestamp(timestamp)
                    .body(notifyBody)
                    .build();

            // 创建通知解析器，使用NotificationConfig
            NotificationParser parser = new NotificationParser(notificationConfig);
            
            // 解析回调通知
            Transaction transaction = parser.parse(requestParam, Transaction.class);
            
            NotifyResult result = new NotifyResult();
            result.setOutTradeNo(transaction.getOutTradeNo());
            result.setTransactionId(transaction.getTransactionId());
            result.setTradeState(transaction.getTradeState().name());
            
            return result;
        } catch (Exception e) {
            throw new RuntimeException("解析微信支付回调失败", e);
        }
    }

    public static class OrderStatus {
        private String tradeState;
        private String transactionId;

        public String getTradeState() {
            return tradeState;
        }

        public void setTradeState(String tradeState) {
            this.tradeState = tradeState;
        }

        public String getTransactionId() {
            return transactionId;
        }

        public void setTransactionId(String transactionId) {
            this.transactionId = transactionId;
        }
    }

    public static class NotifyResult {
        private String outTradeNo;
        private String transactionId;
        private String tradeState;

        public String getOutTradeNo() {
            return outTradeNo;
        }

        public void setOutTradeNo(String outTradeNo) {
            this.outTradeNo = outTradeNo;
        }

        public String getTransactionId() {
            return transactionId;
        }

        public void setTransactionId(String transactionId) {
            this.transactionId = transactionId;
        }

        public String getTradeState() {
            return tradeState;
        }

        public void setTradeState(String tradeState) {
            this.tradeState = tradeState;
        }
    }
} 