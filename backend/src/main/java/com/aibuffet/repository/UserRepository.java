package com.aibuffet.repository;

import com.aibuffet.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);

    Optional<User> findByUnionid(String unionid);
    Optional<User> findByUsername(String username);
    boolean existsByPhone(String phone);
    boolean existsByUsername(String username);
}
