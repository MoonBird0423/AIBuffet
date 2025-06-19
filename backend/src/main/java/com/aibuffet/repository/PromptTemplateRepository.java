package com.aibuffet.repository;

import com.aibuffet.model.PromptTemplate;
import com.aibuffet.model.PromptTemplateId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 提示词模板Repository
 */
@Repository
public interface PromptTemplateRepository extends JpaRepository<PromptTemplate, PromptTemplateId> {

    /**
     * 根据名称查找当前生效的提示词
     */
    Optional<PromptTemplate> findByNameAndIsActiveTrue(String name);

    /**
     * 根据名称查找所有版本，按版本号降序排列
     */
    List<PromptTemplate> findByNameOrderByVersionDesc(String name);

    /**
     * 检查同名是否已有生效版本
     */
    boolean existsByNameAndIsActiveTrue(String name);

    /**
     * 根据名称和版本查找提示词
     */
    Optional<PromptTemplate> findByNameAndVersion(String name, Integer version);

    /**
     * 将指定名称的所有版本设为非生效状态
     */
    @Modifying
    @Query("UPDATE PromptTemplate p SET p.isActive = false WHERE p.name = :name")
    void deactivateAllVersionsByName(@Param("name") String name);

    /**
     * 获取所有提示词名称（去重）
     */
    @Query("SELECT DISTINCT p.name FROM PromptTemplate p ORDER BY p.name")
    List<String> findAllDistinctNames();

    /**
     * 根据名称获取最新版本号
     */
    @Query("SELECT MAX(p.version) FROM PromptTemplate p WHERE p.name = :name")
    Optional<Integer> findMaxVersionByName(@Param("name") String name);
}
