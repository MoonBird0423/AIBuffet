package com.aibuffet.service;

import com.aibuffet.model.PromptTemplate;
import com.aibuffet.repository.PromptTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 提示词模板服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromptTemplateService {

    private final PromptTemplateRepository promptTemplateRepository;


    /**
     * 获取生效的提示词内容
     * 使用缓存提高性能
     */
    @Cacheable(value = "activePrompts", key = "#name")
    public String getActivePromptContent(String name) {
        log.debug("获取提示词内容: {}", name);
        
        Optional<PromptTemplate> template = promptTemplateRepository.findByNameAndIsActiveTrue(name);
        
        if (template.isPresent()) {
            log.debug("从数据库获取到提示词: {}, 版本: {}", name, template.get().getVersion());
            return template.get().getContent();
        }
        
        log.error("未找到提示词: {}", name);
        throw new RuntimeException("未找到提示词: " + name);
    }

    /**
     * 创建新版本提示词
     */
    @Transactional
    @CacheEvict(value = "activePrompts", key = "#name")
    public PromptTemplate createNewVersion(String name, String content, String description) {
        log.info("创建新版本提示词: {}", name);
        
        // 获取当前最大版本号
        Integer maxVersion = promptTemplateRepository.findMaxVersionByName(name).orElse(0);
        Integer newVersion = maxVersion + 1;
        
        // 创建新版本
        PromptTemplate newTemplate = new PromptTemplate(name, newVersion, content, description);
        
        return promptTemplateRepository.save(newTemplate);
    }

    /**
     * 激活指定版本
     */
    @Transactional
    @CacheEvict(value = "activePrompts", key = "#name")
    public void activateVersion(String name, Integer version) {
        log.info("激活提示词版本: {} v{}", name, version);
        
        // 先将该名称下的所有版本设为非生效
        promptTemplateRepository.deactivateAllVersionsByName(name);
        
        // 激活指定版本
        Optional<PromptTemplate> template = promptTemplateRepository.findByNameAndVersion(name, version);
        if (template.isPresent()) {
            PromptTemplate activeTemplate = template.get();
            activeTemplate.setIsActive(true);
            promptTemplateRepository.save(activeTemplate);
            log.info("成功激活提示词版本: {} v{}", name, version);
        } else {
            throw new RuntimeException("未找到指定版本的提示词: " + name + " v" + version);
        }
    }

    /**
     * 获取版本历史
     */
    public List<PromptTemplate> getVersionHistory(String name) {
        log.debug("获取提示词版本历史: {}", name);
        return promptTemplateRepository.findByNameOrderByVersionDesc(name);
    }

    /**
     * 获取所有提示词名称
     */
    public List<String> getAllPromptNames() {
        return promptTemplateRepository.findAllDistinctNames();
    }

    /**
     * 获取指定名称和版本的提示词
     */
    public Optional<PromptTemplate> getPromptTemplate(String name, Integer version) {
        return promptTemplateRepository.findByNameAndVersion(name, version);
    }

    /**
     * 获取当前生效的提示词模板
     */
    public Optional<PromptTemplate> getActivePromptTemplate(String name) {
        return promptTemplateRepository.findByNameAndIsActiveTrue(name);
    }

    /**
     * 删除指定版本的提示词
     */
    @Transactional
    @CacheEvict(value = "activePrompts", key = "#name")
    public void deleteVersion(String name, Integer version) {
        log.info("删除提示词版本: {} v{}", name, version);
        
        Optional<PromptTemplate> template = promptTemplateRepository.findByNameAndVersion(name, version);
        if (template.isPresent()) {
            PromptTemplate toDelete = template.get();
            if (toDelete.getIsActive()) {
                throw new RuntimeException("不能删除当前生效的版本，请先激活其他版本");
            }
            promptTemplateRepository.delete(toDelete);
            log.info("成功删除提示词版本: {} v{}", name, version);
        } else {
            throw new RuntimeException("未找到指定版本的提示词: " + name + " v" + version);
        }
    }
}
