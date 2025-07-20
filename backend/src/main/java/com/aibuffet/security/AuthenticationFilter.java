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

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");
            logger.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
            logger.debug("Authorization header: {}", authHeader);

            // 如果有Authorization header，尝试解析JWT token
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    handleAuthentication(authHeader);
                    logger.debug("Authentication successful");
                } catch (Exception e) {
                    logger.debug("Authentication failed: {}", e.getMessage());
                    // 清除可能存在的认证信息
                    SecurityContextHolder.clearContext();
                    // 不直接返回错误，让Spring Security的权限控制来决定是否需要认证
                }
            }

            // 继续执行过滤器链，让Spring Security决定是否需要认证
            chain.doFilter(request, response);
        } catch (Exception e) {
            logger.error("Authentication filter error", e);
            SecurityContextHolder.clearContext();
            // 继续执行，让Spring Security处理
            chain.doFilter(request, response);
        }
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format("{\"code\":4003,\"message\":\"%s\"}", message));
    }

    private void handleAuthentication(String token) {
        logger.debug("Handling authentication for token: {}", token);
        
        // 如果token开头还有Bearer，去掉它
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
            logger.debug("Removed Bearer prefix, token: {}", token);
        }
        
        // 验证token
        if (!jwtUtil.validateToken(token)) {
            logger.warn("Token validation failed");
            throw new RuntimeException("Token validation failed");
        }

        // 从token中获取用户ID
        Long userId = jwtUtil.getUserIdFromToken(token);
        logger.debug("Extracted userId: {}", userId);
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user,
                null,
                user.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            logger.info("Auth SUCCESS - userId: {}", userId);
            logger.debug("SecurityContext set with auth: {}", auth);
        } else {
            logger.warn("User not found for userId: {}", userId);
            SecurityContextHolder.clearContext();
            throw new RuntimeException("User not found");
        }
    }
}
