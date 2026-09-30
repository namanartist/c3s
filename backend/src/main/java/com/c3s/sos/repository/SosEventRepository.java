package com.c3s.sos.repository;

import com.c3s.sos.entity.SosEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SosEventRepository extends JpaRepository<SosEvent, UUID> {
    @Query("SELECT s FROM SosEvent s WHERE s.user.id = :userId AND s.status NOT IN ('RESOLVED', 'CANCELLED') ORDER BY s.triggeredAt DESC LIMIT 1")
    Optional<SosEvent> findActiveSosByUser(@Param("userId") UUID userId);

    List<SosEvent> findByStatus(String status);
}
