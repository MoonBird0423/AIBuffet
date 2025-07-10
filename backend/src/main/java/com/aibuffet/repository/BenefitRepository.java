package com.aibuffet.repository;

import com.aibuffet.model.Benefit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BenefitRepository extends JpaRepository<Benefit, Long> {
    Benefit findByIdentifier(String identifier);
}
