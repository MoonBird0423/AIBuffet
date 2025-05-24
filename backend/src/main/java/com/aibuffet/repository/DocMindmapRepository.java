package com.aibuffet.repository;

import com.aibuffet.model.DocMindmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocMindmapRepository extends JpaRepository<DocMindmap, Long> {
    Optional<DocMindmap> findByDocId(Long docId);
}
