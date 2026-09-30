package com.c3s.audit.repository;

import com.c3s.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByActorIdOrderByTimestampDesc(UUID actorId, Pageable pageable);
    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE (:action IS NULL OR a.action = :action) AND (:actorRole IS NULL OR a.actorRole = :actorRole) AND a.timestamp >= :since ORDER BY a.timestamp DESC")
    Page<AuditLog> findFiltered(@Param("action") String action, @Param("actorRole") String actorRole, @Param("since") OffsetDateTime since, Pageable pageable);

    long deleteByTimestampBefore(OffsetDateTime cutoff);
}
