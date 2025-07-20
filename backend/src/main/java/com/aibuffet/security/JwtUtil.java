package com.aibuffet.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import javax.crypto.SecretKey;
import java.util.Date;
import java.nio.charset.StandardCharsets;
import jakarta.annotation.PostConstruct;

@Component
public class JwtUtil {
    @Value("${jwt.expiration}")
    private long expirationTime;
    
    @Value("${jwt.secret:aibuffet-secret-key-for-jwt-token-generation-and-validation}")
    private String jwtSecret;

    private SecretKey key;

    @PostConstruct
    public void init() {
        // 使用固定的密钥，确保应用重启后token仍然有效
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 生成JWT Token
     * @param userId 用户ID
     * @return JWT Token
     */
    public String generateToken(Long userId) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(now)
                .setExpiration(expirationDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * 从token中获取用户ID（字符串形式）
     * @param token JWT Token
     * @return 用户ID字符串
     */
    public String getUserIdStringFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    // 如需Long类型可自行转换
    public Long getUserIdFromToken(String token) {
        String idStr = getUserIdStringFromToken(token);
        try {
            return Long.valueOf(idStr);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 验证token是否有效
     * @param token JWT Token
     * @return true:有效 false:无效
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Date expiration = claims.getExpiration();
            return !expiration.before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 从token中获取Claims
     * @param token JWT Token
     * @return Claims
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 获取token的过期时间
     * @param token JWT Token
     * @return 过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimsFromToken(token).getExpiration();
    }
}
