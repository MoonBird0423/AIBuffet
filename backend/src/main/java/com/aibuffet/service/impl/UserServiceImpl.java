package com.aibuffet.service.impl;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.model.User;
import com.aibuffet.repository.UserRepository;
import com.aibuffet.service.UserService;
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

    @Override
    @Transactional
    public ApiResponse loginWithPhone(String phone, String code) {
        // 验证验证码
        if (!verificationCodeService.verifyCode(phone, code)) {
            return ApiResponse.error(ErrorCode.SMS_CODE_INVALID);
        }

        try {
            // 查找或创建用户
            User user = userRepository.findByPhone(phone)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setPhone(phone);
                        newUser.setUsername("用户" + phone.substring(7)); // 使用手机号后4位作为默认用户名
                        return userRepository.save(newUser);
                    });

            // 更新最后登录时间
            user.setLastLoginTime(LocalDateTime.now());
            userRepository.save(user);

            // 设置认证信息
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                user.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 生成token（使用手机号而不是用户名）
            String token = phone + "_" + System.currentTimeMillis();

            // 返回用户信息
            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("username", user.getUserDisplayName());
            data.put("phone", user.getPhone());
            data.put("avatar", user.getAvatar());
            data.put("token", token);

            return ApiResponse.success(data);
        } catch (Exception e) {
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