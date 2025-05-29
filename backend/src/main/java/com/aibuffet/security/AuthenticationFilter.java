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
        
        String authHeader = request.getHeader("Authorization");
        logger.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
        logger.debug("Authorization header: {}", authHeader);

        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                
                // 统一处理所有请求的认证
                handleAuthentication(token);
            } else {
                // 如果是登录相关的请求，允许通过
                if (request.getRequestURI().startsWith("/api/auth/")) {
                    logger.debug("Allowing auth request to proceed without token");
                } else {
                    logger.debug("No auth header found, clearing security context");
                    SecurityContextHolder.clearContext();
                }
            }
        } catch (Exception e) {
            logger.error("Authentication error", e);
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }

    private void handleAuthentication(String token) {
        try {
            // 从token中提取手机号（格式为 "phone_timestamp"）
            String phone = token.split("_")[0];
            User user = userRepository.findByPhone(phone).orElse(null);

            if (user != null) {
                // 使用用户ID作为principal
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    user.getId().toString(),  // 使用用户ID字符串
                    null,
                    user.getAuthorities()
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
                logger.debug("Successfully authenticated user with phone: {}, userId: {}", phone, user.getId());
            } else {
                logger.warn("User not found for phone: {}", phone);
                SecurityContextHolder.clearContext();
            }
        } catch (Exception e) {
            logger.error("Token parsing error", e);
            SecurityContextHolder.clearContext();
        }
    }
}
