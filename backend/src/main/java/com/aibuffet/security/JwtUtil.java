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

    private SecretKey key;

    @PostConstruct
    public void init() {
        // 使用Keys工具类生成安全的HS512密钥
        this.key = Keys.secretKeyFor(SignatureAlgorithm.HS512);
    }

    /**
     * 生成JWT Token
     * @param phone 用户手机号
     * @param userId 用户ID
     * @return JWT Token
     */
    public String generateToken(String phone, Long userId) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .setSubject(phone)
                .claim("userId", userId)
                .setIssuedAt(now)
                .setExpiration(expirationDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * 从token中获取用户手机号
     * @param token JWT Token
     * @return 用户手机号
     */
    public String getPhoneFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    /**
     * 从token中获取用户ID
     * @param token JWT Token
     * @return 用户ID
     */
    public Long getUserIdFromToken(String token) {
        return getClaimsFromToken(token).get("userId", Long.class);
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
