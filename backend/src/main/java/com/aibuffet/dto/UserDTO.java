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
    
    // 标记是否为新用户
    private boolean newUser;

    // 登录响应不需要返回密码
    public static UserDTO fromUser(com.aibuffet.model.User user, boolean isNewUser) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setAvatar(user.getAvatar());
        dto.setPhone(user.getPhone());
        dto.setNewUser(isNewUser);
        return dto;
    }
    
    public static UserDTO fromUser(com.aibuffet.model.User user) {
        return fromUser(user, false);
    }
}