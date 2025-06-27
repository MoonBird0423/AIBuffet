package com.aibuffet.config;

import com.aibuffet.controller.ChatCompletionWebSocketHandler;
import com.aibuffet.model.User;
import com.aibuffet.repository.UserRepository;
import com.aibuffet.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);
    
    private final ChatCompletionWebSocketHandler handler;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserRepository userRepository;

    public WebSocketConfig(ChatCompletionWebSocketHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/chat/completions")
                .addInterceptors(new WebSocketAuthInterceptor())
                .setAllowedOrigins("*");
    }
    
    /**
     * WebSocket认证拦截器
     */
    private class WebSocketAuthInterceptor implements HandshakeInterceptor {
        
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                     WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
            try {
                // 使用INFO级别日志
                logger.info("[WebSocket Auth] ===== WebSocket握手认证开始 =====");
                logger.info("[WebSocket Auth] WebSocket握手尝试，来源: {}", request.getRemoteAddress());
                logger.info("[WebSocket Auth] 请求URI: {}", request.getURI());
                
                String token = null;
                
                // 首先尝试从Authorization header获取token
                String authHeader = request.getHeaders().getFirst("Authorization");
                logger.info("[WebSocket Auth] Authorization header: {}", authHeader != null ? "存在" : "缺失");
                
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                    logger.info("[WebSocket Auth] 从Authorization header提取token");
                } else {
                    // 如果header中没有，尝试从URL参数获取
                    String query = request.getURI().getQuery();
                    logger.info("[WebSocket Auth] URL查询参数: {}", query);
                    
                    if (query != null) {
                        String[] params = query.split("&");
                        for (String param : params) {
                            String[] keyValue = param.split("=");
                            if (keyValue.length == 2 && "token".equals(keyValue[0])) {
                                try {
                                    // URL解码token
                                    token = java.net.URLDecoder.decode(keyValue[1], "UTF-8");
                                    logger.info("[WebSocket Auth] 从URL参数提取token，长度: {}", token.length());
                                } catch (Exception e) {
                                    logger.warn("[WebSocket Auth] URL解码token失败: {}", e.getMessage());
                                    token = keyValue[1]; // 使用原始值
                                }
                                break;
                            }
                        }
                    }
                }
                
                if (token == null || token.trim().isEmpty()) {
                    logger.warn("[WebSocket Auth] WebSocket连接缺少认证token");
                    return false;
                }
                
                logger.info("[WebSocket Auth] 找到token，长度: {}", token.length());
                
                // 验证token
                try {
                    if (!jwtUtil.validateToken(token)) {
                        logger.warn("[WebSocket Auth] WebSocket连接token验证失败");
                        return false;
                    }
                } catch (Exception e) {
                    logger.warn("[WebSocket Auth] Token验证过程中发生异常: {}", e.getMessage());
                    return false;
                }
                
                logger.info("[WebSocket Auth] Token验证成功");
                
                // 获取用户信息
                try {
                    String phone = jwtUtil.getPhoneFromToken(token);
                    Long userId = jwtUtil.getUserIdFromToken(token);
                    
                    logger.info("[WebSocket Auth] 提取用户信息 - 手机: {}, 用户ID: {}", phone, userId);
                    
                    User user = userRepository.findById(userId).orElse(null);
                    if (user == null || !user.getPhone().equals(phone)) {
                        logger.warn("[WebSocket Auth] WebSocket连接用户信息验证失败: userId={}, phone={}", userId, phone);
                        return false;
                    }
                    
                    // 将用户信息存储到WebSocket session属性中
                    attributes.put("user", user);
                    logger.info("[WebSocket Auth] WebSocket认证成功: userId={}, phone={}", userId, phone);
                    
                    // 使用INFO级别日志
                    logger.info("[WebSocket Auth] ===== WebSocket握手认证成功 =====");
                    
                    return true;
                } catch (Exception e) {
                    logger.warn("[WebSocket Auth] 获取用户信息时发生异常: {}", e.getMessage());
                    return false;
                }
            } catch (Exception e) {
                logger.error("[WebSocket Auth] WebSocket认证过程中发生错误", e);
                return false;
            }
        }
        
        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                 WebSocketHandler wsHandler, Exception exception) {
            // 握手后的处理，这里不需要特殊处理
        }
    }
} 