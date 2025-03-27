package com.aibuffet.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String avatar;
    private String phone;
    
    // 用于注册的额外字段
    private String wechat;

    // 登录响应不需要返回密码
    public static UserDTO fromUser(com.aibuffet.model.User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setAvatar(user.getAvatar());
        dto.setPhone(user.getPhone());
        return dto;
    }
}