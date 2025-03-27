package com.aibuffet.service;

import com.aibuffet.common.ErrorCode;
import com.aibuffet.dto.UserDTO;
import com.aibuffet.model.User;
import com.aibuffet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final VerificationCodeService verificationCodeService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public UserDTO loginWithPhone(String phone, String code) {
        // 验证手机验证码
        if (!verificationCodeService.verifyCode(phone, code)) {
            throw new RuntimeException(ErrorCode.SMS_CODE_INVALID.getMessage());
        }

        // 查找用户，不存在则注册
        User user = userRepository.findByPhone(phone)
                .orElseGet(() -> registerNewUser(phone));

        return UserDTO.fromUser(user);
    }

    private User registerNewUser(String phone) {
        // 生成默认用户名和密码
        String defaultUsername = phone.substring(phone.length() - 4) + "用户";
        String defaultPassword = "ai" + phone.substring(phone.length() - 4);
        
        // 检查用户名是否已存在
        String username = defaultUsername;
        int suffix = 1;
        while (userRepository.findByUsername(username).isPresent()) {
            username = defaultUsername + suffix++;
        }

        User user = new User();
        user.setPhone(phone);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(defaultPassword));
        user.setAvatar("https://www.gravatar.com/avatar/" + phone.hashCode() + "?d=mp");
        
        return userRepository.save(user);
    }

    @Transactional
    public UserDTO registerUser(String phone, String username, String wechat, String avatar) {
        // 验证手机号是否已注册
        if (userRepository.existsByPhone(phone)) {
            throw new RuntimeException(ErrorCode.PHONE_EXISTS.getMessage());
        }

        // 如果未提供用户名，使用默认用户名
        if (username == null || username.trim().isEmpty()) {
            username = phone.substring(phone.length() - 4) + "用户";
        }

        // 检查用户名是否已存在
        String finalUsername = username;
        int suffix = 1;
        while (userRepository.findByUsername(finalUsername).isPresent()) {
            finalUsername = username + suffix++;
        }

        // 设置默认密码
        String defaultPassword = "ai" + phone.substring(phone.length() - 4);

        // 如果未提供头像，使用默认头像
        if (avatar == null || avatar.trim().isEmpty()) {
            avatar = "https://www.gravatar.com/avatar/" + phone.hashCode() + "?d=mp";
        }

        User user = new User();
        user.setPhone(phone);
        user.setUsername(finalUsername);
        user.setPassword(passwordEncoder.encode(defaultPassword));
        user.setAvatar(avatar);
        if (wechat != null && !wechat.trim().isEmpty()) {
            user.setWechat(wechat);
        }

        user = userRepository.save(user);
        return UserDTO.fromUser(user);
    }

    public boolean isPhoneRegistered(String phone) {
        return userRepository.existsByPhone(phone);
    }
}