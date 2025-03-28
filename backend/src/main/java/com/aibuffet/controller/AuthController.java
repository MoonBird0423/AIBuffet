package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.dto.CaptchaResponse;
import com.aibuffet.service.CaptchaService;
import com.aibuffet.service.UserService;
import com.aibuffet.service.VerificationCodeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private CaptchaService captchaService;

    @Autowired
    private VerificationCodeService verificationCodeService;
    
    @Autowired
    private UserService userService;

    @GetMapping("/captcha/generate")
    public ApiResponse generateCaptcha(HttpServletRequest request) {
        try {
            String ipAddress = getClientIp(request);
            CaptchaResponse response = captchaService.generateCaptcha(ipAddress);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(ErrorCode.SYSTEM_ERROR);
        }
    }

    @PostMapping("/captcha/validate")
    public ApiResponse validateCaptcha(@RequestBody Map<String, String> request) {
        String captchaId = request.get("captchaId");
        String captchaCode = request.get("captchaCode");

        if (captchaId == null || captchaCode == null) {
            return ApiResponse.error(ErrorCode.PARAM_ERROR);
        }

        boolean isValid = captchaService.validateCaptcha(captchaId, captchaCode);
        if (!isValid) {
            return ApiResponse.error(ErrorCode.CAPTCHA_INVALID);
        }

        return ApiResponse.success();
    }

    @PostMapping("/code/send")
    public ApiResponse sendVerificationCode(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        String captchaId = request.get("captchaId");
        String captchaCode = request.get("captchaCode");

        System.out.println("收到发送验证码请求 - phone: " + phone + ", captchaId: " + captchaId);

        if (phone == null || captchaId == null || captchaCode == null) {
            System.out.println("参数错误 - phone: " + phone + ", captchaId: " + captchaId + ", captchaCode: " + captchaCode);
            return ApiResponse.error(ErrorCode.PARAM_ERROR);
        }

        try {
            System.out.println("开始调用验证码服务发送验证码...");
            verificationCodeService.sendCode(phone, captchaId, captchaCode);
            System.out.println("验证码发送成功");
            return ApiResponse.success();
        } catch (RuntimeException e) {
            System.out.println("验证码发送失败: " + e.getMessage());
            return ApiResponse.error(ErrorCode.SMS_SEND_FAILED, e.getMessage());
        }
    }

    /**
     * 获取客户端真实IP地址
     */
    @PostMapping("/login/phone")
    public ApiResponse loginWithPhone(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        String code = request.get("code");

        System.out.println("收到手机登录请求 - phone: " + phone);

        if (phone == null || code == null) {
            System.out.println("参数错误 - phone: " + phone + ", code: " + code);
            return ApiResponse.error(ErrorCode.PARAM_ERROR);
        }

        return userService.loginWithPhone(phone, code);
    }

    private String getClientIp(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        // 对于通过多个代理的情况，第一个IP为客户端真实IP
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress;
    }
}