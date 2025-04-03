package com.aibuffet.repository;

import com.aibuffet.model.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelRepository extends JpaRepository<Model, Integer> {
    
    @Query("SELECT m FROM Model m WHERE (:name is null OR LOWER(m.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
           "AND (:purpose is null OR LOWER(m.purpose) LIKE LOWER(CONCAT('%', :purpose, '%')))")
    List<Model> findByNameAndPurpose(@Param("name") String name, @Param("purpose") String purpose);

    @Query("SELECT m FROM Model m WHERE LOWER(m.name) = LOWER(:name)")
    Optional<Model> findByNameExact(@Param("name") String name);
}