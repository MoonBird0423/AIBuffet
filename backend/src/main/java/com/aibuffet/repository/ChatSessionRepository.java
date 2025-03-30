package com.aibuffet.repository;

import com.aibuffet.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {
    
    @Query("SELECT c FROM ChatSession c WHERE c.userId = :userId AND c.isDeleted = false ORDER BY c.lastMessageAt DESC")
    List<ChatSession> findByUserIdOrderByLastMessageAtDesc(@Param("userId") String userId);
    
    @Query("SELECT c FROM ChatSession c WHERE c.userId = :userId AND c.sessionId = :sessionId AND c.isDeleted = false")
    ChatSession findByUserIdAndSessionId(@Param("userId") String userId, @Param("sessionId") String sessionId);
    
    @Modifying
    @Transactional
    @Query("UPDATE ChatSession c SET c.isDeleted = true WHERE c.userId = :userId AND c.sessionId = :sessionId")
    void softDeleteByUserIdAndSessionId(@Param("userId") String userId, @Param("sessionId") String sessionId);
}