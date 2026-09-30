package com.c3s.location.repository;

import com.c3s.location.entity.LocationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationSessionRepository extends JpaRepository<LocationSession, UUID> {
    @Query("SELECT s FROM LocationSession s WHERE s.user.id = :userId AND s.status = 'ACTIVE' ORDER BY s.startedAt DESC LIMIT 1")
    Optional<LocationSession> findActiveSessionForUser(@Param("userId") UUID userId);
}
