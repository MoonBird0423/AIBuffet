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
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {
    
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeBaseServiceImpl.class);

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
        knowledgeBase.setDescription(request.getDescription());
        knowledgeBase.setVisibility(request.getVisibility());
        knowledgeBase.setCategory(request.getCategory());
        knowledgeBase.setColorMark(request.getColorMark());
        knowledgeBase.setCreatedBy(userId);
        knowledgeBase.setStatus(KnowledgeBase.Status.ACTIVE);
        
        return knowledgeBaseRepository.save(knowledgeBase);
    }

    @Override
    public Page<KnowledgeBaseResponse> findPublicKnowledgeBases(KnowledgeBaseQuery query) {
        logger.debug("Searching public knowledge bases with query: {}", query);
        
        Specification<KnowledgeBase> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 基础条件：公开且有效
            predicates.add(criteriaBuilder.equal(root.get("visibility"), KnowledgeBase.Visibility.PUBLIC));
            predicates.add(criteriaBuilder.equal(root.get("status"), KnowledgeBase.Status.ACTIVE));
            
            // 分类过滤
            if (query.getCategory() != null) {
                logger.debug("Adding category filter: {}", query.getCategory());
                predicates.add(criteriaBuilder.equal(root.get("category"), query.getCategory()));
            }
            
            // 关键词搜索
            if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
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
    public Page<KnowledgeBaseResponse> findMyKnowledgeBases(KnowledgeBaseQuery query, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        Specification<KnowledgeBase> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 基础条件：用户创建的且有效的
            predicates.add(criteriaBuilder.equal(root.get("createdBy"), user.getId()));
            predicates.add(criteriaBuilder.equal(root.get("status"), KnowledgeBase.Status.ACTIVE));
            
            // 关键词搜索
            if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("name"), "%" + query.getKeyword() + "%"));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<KnowledgeBase> knowledgeBases = knowledgeBaseRepository.findAll(spec, query.toPageRequest());
        
        List<KnowledgeBaseResponse> responses = knowledgeBases.getContent().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
            
        return new PageImpl<>(responses, query.toPageRequest(), knowledgeBases.getTotalElements());
    }

    private KnowledgeBaseResponse convertToResponse(KnowledgeBase knowledgeBase) {
        KnowledgeBaseResponse response = new KnowledgeBaseResponse();
        response.setId(knowledgeBase.getId());
        response.setName(knowledgeBase.getName());
        response.setCreatedBy(knowledgeBase.getCreatedBy());
        response.setCreatedAt(knowledgeBase.getCreatedAt());
        response.setCategory(knowledgeBase.getCategory());
        response.setUsageCount(knowledgeBase.getUsageCount());
        response.setColorMark(knowledgeBase.getColorMark());
        
        // 查询创建者信息
        userRepository.findById(knowledgeBase.getCreatedBy()).ifPresent(user -> {
            response.setCreatorName(user.getUsername());
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
