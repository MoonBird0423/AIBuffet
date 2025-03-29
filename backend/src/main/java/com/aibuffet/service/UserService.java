package com.aibuffet.service;

import com.aibuffet.common.ApiResponse;
import java.util.Map;

public interface UserService {
    /**
     * 手机号验证码登录
     * @param phone 手机号
     * @param code 验证码
     * @return 登录结果
     */
    ApiResponse loginWithPhone(String phone, String code);

    /**
     * 获取用户信息
     * @param userId 用户ID
     * @return 用户信息
     */
    Map<String, Object> getUserProfile(Long userId);

    /**
     * 更新用户头像
     * @param userId 用户ID
     * @param avatarUrl 头像URL
     * @return 更新后的头像URL
     */
    String updateAvatar(Long userId, String avatarUrl);

    /**
     * 更新用户名
     * @param userId 用户ID
     * @param username 新用户名
     * @return 更新后的用户名
     */
    String updateUsername(Long userId, String username);

    /**
     * 退出登录
     * @param userId 用户ID
     */
    void logout(Long userId);
}