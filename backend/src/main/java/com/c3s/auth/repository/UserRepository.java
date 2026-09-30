package com.c3s.auth.repository;

import com.c3s.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUniversityId(String universityId);
    Optional<User> findByEmail(String email);
    boolean existsByUniversityId(String universityId);
    boolean existsByEmail(String email);
}