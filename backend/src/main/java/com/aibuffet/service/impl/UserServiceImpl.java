package com.aibuffet.service.impl;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.model.User;
import com.aibuffet.repository.UserRepository;
import com.aibuffet.service.UserService;
import com.aibuffet.security.JwtUtil;
import com.aibuffet.service.VerificationCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationCodeService verificationCodeService;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    @Transactional
    public ApiResponse loginWithPhone(String phone, String code) {
        System.out.println("开始手机登录流程 - phone: " + phone);
        
        // 验证验证码
        System.out.println("开始验证短信验证码...");
        if (!verificationCodeService.verifyCode(phone, code)) {
            System.out.println("短信验证码验证失败");
            return ApiResponse.error(ErrorCode.SMS_CODE_INVALID);
        }
        System.out.println("短信验证码验证通过");

        try {
            System.out.println("开始查找用户信息...");
            User user = userRepository.findByPhone(phone)
                    .orElseGet(() -> {
                        System.out.println("用户不存在，开始创建新用户");
                        User newUser = new User();
                        newUser.setPhone(phone);
                        String defaultUsername = "用户" + phone.substring(7);
                        newUser.setUsername(defaultUsername);
                        System.out.println("创建新用户 - 默认用户名: " + defaultUsername);
                        return userRepository.save(newUser);
                    });
            System.out.println("用户信息获取成功 - userId: " + user.getId());

            // 更新最后登录时间
            System.out.println("更新用户最后登录时间");
            user.setLastLoginTime(LocalDateTime.now());
            userRepository.save(user);

            System.out.println("设置用户认证信息");
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                user.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 使用JwtUtil生成token
            System.out.println("生成JWT Token");
            String token = jwtUtil.generateToken(phone, user.getId());
            System.out.println("JWT Token生成成功");

            System.out.println("准备返回用户信息");
            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("username", user.getUserDisplayName());
            data.put("phone", user.getPhone());
            data.put("avatar", user.getAvatar());
            data.put("token", token);

            System.out.println("登录成功 - userId: " + user.getId());
            return ApiResponse.success(data);
        } catch (Exception e) {
            System.out.println("登录过程发生异常: " + e.getMessage());
            e.printStackTrace();
            return ApiResponse.error(ErrorCode.LOGIN_FAILED);
        }
    }

    @Override
    public Map<String, Object> getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUserDisplayName());
        profile.put("phone", user.getPhone());
        profile.put("avatar", user.getAvatar());
        profile.put("wechat", user.getWechat());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("updatedAt", user.getUpdatedAt());

        return profile;
    }

    @Override
    @Transactional
    public String updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        user.setAvatar(avatarUrl);
        userRepository.save(user);
        return avatarUrl;
    }

    @Override
    @Transactional
    public String updateUsername(Long userId, String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("用户名不能为空");
        }

        // 检查用户名是否已存在
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("用户名已存在");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        user.setUsername(username.trim());
        userRepository.save(user);
        return username.trim();
    }

    @Override
    @Transactional
    public void logout(Long userId) {
        // 更新最后登录时间
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);

        // 清除认证信息
        SecurityContextHolder.clearContext();
    }
}
