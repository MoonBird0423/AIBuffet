package com.aibuffet.service.impl;

import com.aibuffet.common.ApiResponse;
import com.aibuffet.common.ErrorCode;
import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.model.User;
import com.aibuffet.repository.UserRepository;
import com.aibuffet.service.KnowledgeBaseService;
import com.aibuffet.service.UserService;
import com.aibuffet.security.JwtUtil;
import com.aibuffet.service.VerificationCodeService;
import com.aibuffet.repository.RoleRepository;
import com.aibuffet.model.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationCodeService verificationCodeService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private KnowledgeBaseService knowledgeBaseService;

    @Autowired
    private RoleRepository roleRepository;

    // 微信登录配置
    @Value("${wechat.login.appid}")
    private String wechatLoginAppid;

    @Value("${wechat.login.secret}")
    private String wechatLoginSecret;

    // 微信扫码登录
    @Transactional
    public ApiResponse loginWithWeChat(String code, String state) {
        logger.info("loginWithWeChat called, code={}, state={}", code, state);
        try {
            // 1. 获取access_token和openid、unionid
            String tokenUrl = UriComponentsBuilder.fromHttpUrl("https://api.weixin.qq.com/sns/oauth2/access_token")
                    .queryParam("appid", wechatLoginAppid)
                    .queryParam("secret", wechatLoginSecret)
                    .queryParam("code", code)
                    .queryParam("grant_type", "authorization_code")
                    .toUriString();

            WebClient webClient = WebClient.create();
            String tokenResp = webClient.get().uri(tokenUrl).retrieve().bodyToMono(String.class).block();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode tokenJson = mapper.readTree(tokenResp);

            if (tokenJson.has("errcode")) {
                return ApiResponse.error(400, "微信授权失败: " + tokenJson.get("errmsg").asText());
            }

            String accessToken = tokenJson.get("access_token").asText();
            String openid = tokenJson.get("openid").asText();
            String unionid = tokenJson.has("unionid") ? tokenJson.get("unionid").asText() : null;

            // 2. 获取微信用户信息
            String userinfoUrl = UriComponentsBuilder.fromHttpUrl("https://api.weixin.qq.com/sns/userinfo")
                    .queryParam("access_token", accessToken)
                    .queryParam("openid", openid)
                    .toUriString();
            String userinfoResp = webClient.get().uri(userinfoUrl).retrieve().bodyToMono(String.class).block();
            JsonNode userinfoJson = mapper.readTree(userinfoResp);
            logger.info("WeChat user info: {}", userinfoJson);

            if (userinfoJson.has("errcode")) {
                return ApiResponse.error(400, "获取微信用户信息失败: " + userinfoJson.get("errmsg").asText());
            }

            String nickname = userinfoJson.get("nickname").asText();

            // 3. 查找或创建用户
            User user = null;
            if (unionid != null) {
                user = userRepository.findByUnionid(unionid).orElse(null);
            }
            if (user == null) {
                user = new User();
                user.setUsername(nickname);
                user.setAvatar(userinfoJson.get("headimgurl").asText());
                user.setOpenidApp1(openid);
                user.setUnionid(unionid);
                user = userRepository.save(user);

                // 创建默认知识库
                CreateKnowledgeBaseRequest request = new CreateKnowledgeBaseRequest();
                request.setName("我的知识库");
                knowledgeBaseService.createKnowledgeBase(request, user.getId());
            } else {
                user.setOpenidApp1(openid);
                logger.info("nickname before setUsername: {}", nickname);
                user.setUsername(nickname);
                logger.info("user after setUsername: {}", user);
                logger.info("user.username field: {}", user.getUserDisplayName());
                user.setAvatar(userinfoJson.get("headimgurl").asText());
                user = userRepository.save(user);
            }

            // 更新最后登录时间
            user.setLastLoginTime(LocalDateTime.now());
            user = userRepository.save(user);

            // 重新查一次，确保所有字段为最新
            user = userRepository.findById(user.getId()).orElse(null);

            // 认证信息
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                user.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 生成JWT Token
            String token = jwtUtil.generateToken(user.getId());

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("username", user.getUserDisplayName());
            data.put("phone", user.getPhone());
            data.put("avatar", user.getAvatar());
            data.put("token", token);

            logger.info("WeChat login user: {}", user);
            return ApiResponse.success(data);
        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error(500, "微信登录异常: " + e.getMessage());
        }
    }

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
                        User savedUser = userRepository.save(newUser);

                        // 为新用户创建默认知识库
                        System.out.println("开始创建默认知识库");
                        CreateKnowledgeBaseRequest request = new CreateKnowledgeBaseRequest();
                        request.setName("我的知识库");
                        knowledgeBaseService.createKnowledgeBase(request, savedUser.getId());
                        System.out.println("默认知识库创建完成");

                        return savedUser;
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
            String token = jwtUtil.generateToken(user.getId());
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
        profile.put("roleId", user.getRoleId());
        profile.put("expireTime", user.getExpireTime());

        // 查询会员类型名称
        String memberName = null;
        if (user.getRoleId() != null) {
            Role role = roleRepository.findById(user.getRoleId()).orElse(null);
            if (role != null) {
                memberName = role.getName();
            }
        }
        profile.put("name", memberName);

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
