package com.aibuffet.config;

import com.aibuffet.security.AuthenticationFilter;
import com.aibuffet.security.AuthEntryPoint;
import com.aibuffet.security.AccessDeniedHandlerImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.session.SessionManagementFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.http.HttpMethod;

import java.util.Arrays;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private AuthenticationFilter authenticationFilter;
    
    @Autowired
    private AuthEntryPoint authEntryPoint;
    
    @Autowired
    private AccessDeniedHandlerImpl accessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/**")
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/knowledge-bases/public/**").permitAll()
                // 新增：无需登录的图书功能
                .requestMatchers(HttpMethod.GET, "/api/documents").permitAll()                    // 图书搜索、分类筛选
                .requestMatchers(HttpMethod.GET, "/api/documents/*").permitAll()                 // 图书信息查询  
                .requestMatchers(HttpMethod.GET, "/api/publish/docs/*/interpretation").permitAll() // 图书文字解读查询
                .requestMatchers(HttpMethod.GET, "/api/documents/*/audio").permitAll()           // 获取音频URL
                .requestMatchers(HttpMethod.GET, "/api/documents/*/audio/status").permitAll()    // 音频状态查询
                .anyRequest().authenticated())
            .addFilterBefore(
                authenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(3)
                .sessionRegistry(sessionRegistry())
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Use allowedOriginPatterns instead of allowedOrigins to avoid conflicts with allowCredentials
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }
}
