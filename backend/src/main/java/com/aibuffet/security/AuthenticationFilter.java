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
                String token = authHeader.substring(7);
                if (!handleAuthentication(token)) {
                    logger.debug("Authentication failed for token");
                    sendUnauthorizedError(response, "认证失败：无效的token");
                    return;
                }
            } else if (!request.getRequestURI().startsWith("/api/auth/")) {
                logger.debug("No auth header found for protected resource");
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
            // 从token中提取手机号（格式为 "phone_timestamp"）
            String phone = token.split("_")[0];
            User user = userRepository.findByPhone(phone).orElse(null);

            if (user != null) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    user.getId().toString(),
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
            logger.error("Token parsing error", e);
            SecurityContextHolder.clearContext();
            return false;
        }
    }
}
