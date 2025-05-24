package com.aibuffet.repository;

import com.aibuffet.model.DocQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocQuizRepository extends JpaRepository<DocQuiz, Long> {
    Optional<DocQuiz> findByDocId(Long docId);
}
