package com.aibuffet.controller;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.model.User;
import com.aibuffet.service.OSSService;
import com.aibuffet.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private OSSService ossService;

    /**
     * 获取用户信息
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getUserProfile(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "未认证用户"));
        }
        return ResponseEntity.ok(ApiResponse.success(userService.getUserProfile(user.getId())));
    }

    /**
     * 更新用户头像
     */
    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse> updateAvatar(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "未认证用户"));
        }

        // 验证文件
        if (!ossService.isValidAvatarImage(file)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "无效的头像格式或大小超过限制"));
        }

        try {
            String avatarUrl = ossService.uploadAvatar(file, user.getId());
            userService.updateAvatar(user.getId(), avatarUrl);
            return ResponseEntity.ok(ApiResponse.success(avatarUrl));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error(500, "文件上传失败"));
        }
    }

    /**
     * 更新用户名
     */
    @PutMapping("/username")
    public ResponseEntity<ApiResponse> updateUsername(
            @AuthenticationPrincipal User user,
            @RequestBody UsernameUpdateRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "未认证用户"));
        }

        String newUsername = request.getUsername();
        if (newUsername == null || newUsername.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "用户名不能为空"));
        }

        try {
            String username = userService.updateUsername(user.getId(), newUsername.trim());
            return ResponseEntity.ok(ApiResponse.success(username));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, e.getMessage()));
        }
    }

    /**
     * 退出登录
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(@AuthenticationPrincipal User user) {
        userService.logout(user.getId());
        return ResponseEntity.ok(ApiResponse.success("退出成功"));
    }
}

class UsernameUpdateRequest {
    private String username;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
