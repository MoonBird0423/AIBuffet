package com.aibuffet.service.impl;

import com.aibuffet.dto.CreateKnowledgeBaseRequest;
import com.aibuffet.dto.KnowledgeBaseQuery;
import com.aibuffet.dto.KnowledgeBaseResponse;
import com.aibuffet.model.KnowledgeBase;
import com.aibuffet.model.User;
import com.aibuffet.repository.KnowledgeBaseRepository;
import com.aibuffet.repository.UserRepository;
import com.aibuffet.service.KnowledgeBaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.StringUtils;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {
    
    private static final int PAGE_SIZE = 10;
    
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeBaseServiceImpl.class);

    @Override
    @Transactional
    public KnowledgeBase updateKnowledgeBase(Long id, CreateKnowledgeBaseRequest request, Long userId) {
        logger.debug("Updating knowledge base with id: {}, name: {}", id, request.getName());
        
        KnowledgeBase knowledgeBase = knowledgeBaseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("知识库不存在"));
            
        if (!knowledgeBase.getCreatedBy().equals(userId)) {
            logger.warn("User {} attempted to update knowledge base {} owned by {}", 
                userId, id, knowledgeBase.getCreatedBy());
            throw new IllegalArgumentException("无权修改此知识库");
        }
        
        knowledgeBase.setName(request.getName());
        KnowledgeBase savedKnowledgeBase = knowledgeBaseRepository.save(knowledgeBase);
        logger.debug("Successfully updated knowledge base: {}", savedKnowledgeBase.getId());
        
        return savedKnowledgeBase;
    }

    @Autowired
    private KnowledgeBaseRepository knowledgeBaseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public KnowledgeBase createKnowledgeBase(CreateKnowledgeBaseRequest request, Long userId) {
        KnowledgeBase knowledgeBase = new KnowledgeBase();
        knowledgeBase.setName(request.getName());
        knowledgeBase.setCreatedBy(userId);
        
        return knowledgeBaseRepository.save(knowledgeBase);
    }

    @Override
    public Page<KnowledgeBaseResponse> findKnowledgeBases(KnowledgeBaseQuery query) {
        logger.debug("Searching knowledge bases with query: {}", query);
        
        Specification<KnowledgeBase> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 关键词搜索
            if (StringUtils.hasText(query.getKeyword())) {
                logger.debug("Adding keyword filter: {}", query.getKeyword());
                predicates.add(criteriaBuilder.like(root.get("name"), "%" + query.getKeyword() + "%"));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<KnowledgeBase> knowledgeBases = knowledgeBaseRepository.findAll(spec, query.toPageRequest());
        logger.debug("Found {} knowledge bases matching the criteria", knowledgeBases.getTotalElements());
        
        List<KnowledgeBaseResponse> responses = knowledgeBases.getContent().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
            
        return new PageImpl<>(responses, query.toPageRequest(), knowledgeBases.getTotalElements());
    }

    @Override
    public KnowledgeBaseResponse getKnowledgeBase(Long id) {
        KnowledgeBase knowledgeBase = knowledgeBaseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("知识库不存在"));
            
        return convertToResponse(knowledgeBase);
    }

    @Override
    public Page<KnowledgeBaseResponse> findMyKnowledgeBases(KnowledgeBaseQuery query, Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        
        Specification<KnowledgeBase> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 创建者条件
            predicates.add(criteriaBuilder.equal(root.get("createdBy"), userId));
            
            // 关键词搜索
            if (StringUtils.hasText(query.getKeyword())) {
                predicates.add(criteriaBuilder.like(root.get("name"), "%" + query.getKeyword() + "%"));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        return knowledgeBaseRepository.findAll(spec, query.toPageRequest()).map(this::convertToResponse);
    }

    @Override
    @Transactional
    public void deleteKnowledgeBase(Long id, Long userId) {
        KnowledgeBase knowledgeBase = knowledgeBaseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("知识库不存在"));
            
        // 验证是否为知识库创建者
        if (!knowledgeBase.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("无权删除此知识库");
        }
        
        // 直接删除知识库
        knowledgeBaseRepository.delete(knowledgeBase);
    }

    private KnowledgeBaseResponse convertToResponse(KnowledgeBase knowledgeBase) {
        KnowledgeBaseResponse response = new KnowledgeBaseResponse();
        response.setId(knowledgeBase.getId());
        response.setName(knowledgeBase.getName());
        response.setCreatedBy(knowledgeBase.getCreatedBy());
        response.setCreatedAt(knowledgeBase.getCreatedAt());
        
        // 查询创建者信息
        userRepository.findById(knowledgeBase.getCreatedBy()).ifPresent(user -> {
            response.setCreatorName(user.getUserDisplayName());
            response.setCreatorAvatar(user.getAvatar());
        });
        
        // 计算文档数量
        Integer docsCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM knowledge_base_files kbf " +
            "JOIN doc_files df ON kbf.file_id = df.id " +
            "WHERE kbf.kb_id = ? AND df.status = 'ACTIVE'",
            Integer.class,
            knowledgeBase.getId()
        );
        response.setDocsCount(docsCount != null ? docsCount : 0);
        
        return response;
    }
}
