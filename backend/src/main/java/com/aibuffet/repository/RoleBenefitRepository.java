package com.aibuffet.repository;

import com.aibuffet.model.RoleBenefit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleBenefitRepository extends JpaRepository<RoleBenefit, Long> {
    List<RoleBenefit> findByRoleId(Long roleId);
    List<RoleBenefit> findByBenefitId(Long benefitId);
    List<RoleBenefit> findByRoleIdAndBenefitId(Long roleId, Long benefitId);
}
