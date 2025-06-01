package com.aibuffet.security;

import com.aibuffet.model.User;
import com.aibuffet.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class AuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");
            logger.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
            logger.debug("Authorization header: {}", authHeader);

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                if (!handleAuthentication(authHeader)) {
                    logger.debug("Authentication failed for token");
                    sendUnauthorizedError(response, "认证失败：无效的token");
                    return;
                }
            } else if (!request.getRequestURI().startsWith("/api/auth/")) {
                logger.debug("No auth header found for protected resource");
                logger.debug("Request URI: {}", request.getRequestURI());
                sendUnauthorizedError(response, "认证失败：缺少token");
                return;
            }

            // 只有认证成功或是认证接口才继续处理
            chain.doFilter(request, response);
        } catch (Exception e) {
            logger.error("Authentication error", e);
            SecurityContextHolder.clearContext();
            if (!response.isCommitted()) {
                sendUnauthorizedError(response, "认证处理异常");
            }
        }
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format("{\"code\":4003,\"message\":\"%s\"}", message));
    }

    private boolean handleAuthentication(String token) {
        try {
            logger.debug("Handling authentication for token: {}", token);
            
            // 如果token开头还有Bearer，去掉它
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
                logger.debug("Removed Bearer prefix, token: {}", token);
            }
            
            // 确保token格式正确
            String[] parts = token.split("_");
            if (parts.length != 2) {
                logger.warn("Invalid token format, expected: phone_timestamp, got: {}", token);
                return false;
            }
            
            // 从token中提取手机号
            String phone = parts[0];
            String timestamp = parts[1];  // 可以用于未来的token过期检查
            
            logger.debug("Extracted phone: {}, timestamp: {}", phone, timestamp);
            
            User user = userRepository.findByPhone(phone).orElse(null);

            if (user != null) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    user, // 直接使用User对象作为Principal
                    null,
                    user.getAuthorities()
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
                logger.debug("Successfully authenticated user with phone: {}, userId: {}", phone, user.getId());
                return true;
            }
            
            logger.warn("User not found for phone: {}", phone);
            SecurityContextHolder.clearContext();
            return false;
        } catch (Exception e) {
            logger.error("Token parsing error: {}", e.getMessage());
            logger.debug("Token parsing stack trace:", e);
            SecurityContextHolder.clearContext();
            return false;
        }
    }
}
