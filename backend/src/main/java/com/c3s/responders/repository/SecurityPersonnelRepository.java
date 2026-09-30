package com.c3s.responders.repository;

import com.c3s.responders.entity.SecurityPersonnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SecurityPersonnelRepository extends JpaRepository<SecurityPersonnel, UUID> {
    Optional<SecurityPersonnel> findByUserId(UUID userId);
    List<SecurityPersonnel> findByStatus(String status);
}
