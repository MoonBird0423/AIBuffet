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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    public KnowledgeBaseResponse getKnowledgeBase(Long id) {
        KnowledgeBase knowledgeBase = knowledgeBaseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("知识库不存在"));
            
        if (knowledgeBase.getStatus() == KnowledgeBase.Status.DELETED) {
            throw new IllegalArgumentException("知识库已删除");
        }
        
        return convertToResponse(knowledgeBase);
    }

    public Page<KnowledgeBaseResponse> findMyKnowledgeBases(KnowledgeBaseQuery query, Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        
        // 构建查询条件
        Specification<KnowledgeBase> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 创建者条件
            predicates.add(criteriaBuilder.equal(root.get("createdBy"), userId));
            
            // 状态条件
            predicates.add(criteriaBuilder.equal(root.get("status"), KnowledgeBase.Status.ACTIVE));
            
            // 关键词搜索
            if (StringUtils.hasText(query.getKeyword())) {
                predicates.add(criteriaBuilder.like(root.get("name"), "%" + query.getKeyword() + "%"));
            }
            
            // 可见性过滤
            if (StringUtils.hasText(query.getVisibility())) {
                predicates.add(criteriaBuilder.equal(root.get("visibility"), KnowledgeBase.Visibility.valueOf(query.getVisibility().toUpperCase())));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        // 分页和排序
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        PageRequest pageRequest = PageRequest.of(query.getPage(), PAGE_SIZE, sort);
        
        return knowledgeBaseRepository.findAll(spec, pageRequest).map(this::convertToResponse);
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
        
        // 软删除：将状态设置为DELETED
        knowledgeBase.setStatus(KnowledgeBase.Status.DELETED);
        knowledgeBaseRepository.save(knowledgeBase);
    }

    @Override
    @Transactional
    public KnowledgeBase updateKnowledgeBaseColor(Long id, String colorMark, Long userId) {
        if (colorMark == null || !colorMark.matches("^#[0-9A-Fa-f]{6}$")) {
            throw new IllegalArgumentException("颜色格式不正确");
        }

        KnowledgeBase knowledgeBase = knowledgeBaseRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("知识库不存在"));
            
        if (!knowledgeBase.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("无权修改此知识库");
        }
        
        knowledgeBase.setColorMark(colorMark);
        return knowledgeBaseRepository.save(knowledgeBase);
    }

    private KnowledgeBaseResponse convertToResponse(KnowledgeBase knowledgeBase) {
        KnowledgeBaseResponse response = new KnowledgeBaseResponse();
        response.setId(knowledgeBase.getId());
        response.setName(knowledgeBase.getName());
        response.setDescription(knowledgeBase.getDescription());
        response.setCreatedBy(knowledgeBase.getCreatedBy());
        response.setCreatedAt(knowledgeBase.getCreatedAt());
        response.setCategory(knowledgeBase.getCategory());
        response.setUsageCount(knowledgeBase.getUsageCount());
        response.setColorMark(knowledgeBase.getColorMark());
        response.setVisibility(knowledgeBase.getVisibility());
        
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
