package com.aibuffet.common;

public enum ErrorCode {
    // 通用错误码
    SUCCESS(200, "操作成功"),
    SYSTEM_ERROR(500, "系统错误"),
    PARAM_ERROR(400, "参数错误"),
    
    // 图形验证码相关错误码
    CAPTCHA_EXPIRED(1001, "图形验证码已过期"),
    CAPTCHA_INVALID(1002, "图形验证码错误"),
    CAPTCHA_RATE_LIMIT(1003, "图形验证码获取过于频繁"),
    
    // 短信验证码相关错误码
    SMS_CAPTCHA_REQUIRED(2001, "请先完成图形验证码验证"),
    SMS_SEND_FAILED(2002, "短信发送失败"),
    SMS_RATE_LIMIT(2003, "短信发送过于频繁"),
    SMS_CODE_INVALID(2004, "短信验证码错误"),
    SMS_CODE_EXPIRED(2005, "短信验证码已过期"),
    
    // 登录注册相关错误码
    LOGIN_FAILED(3001, "登录失败"),
    REGISTER_FAILED(3002, "注册失败"),
    PHONE_NOT_EXISTS(3003, "手机号未注册"),
    PHONE_EXISTS(3004, "手机号已注册"),

    // 资源访问相关错误码
    RESOURCE_NOT_FOUND(4001, "资源不存在"),
    PERMISSION_DENIED(4002, "无权限访问"),
    UNAUTHORIZED(4003, "未经授权的访问"),
    
    // 请求相关错误码
    INVALID_REQUEST(4004, "无效请求参数");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
