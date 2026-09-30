package com.c3s.movement.repository;

import com.c3s.movement.entity.MovementEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MovementEventRepository extends JpaRepository<MovementEvent, UUID> {
    Page<MovementEvent> findByUserIdOrderByTimestampDesc(UUID userId, Pageable pageable);
    Page<MovementEvent> findByGateIdOrderByTimestampDesc(UUID gateId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM MovementEvent m WHERE m.gate.id = :gateId AND m.movementType = :type AND m.verificationStatus = 'VERIFIED' AND m.timestamp >= :since")
    long countByGateAndTypeSince(@Param("gateId") UUID gateId, @Param("type") String type, @Param("since") OffsetDateTime since);

    @Query("SELECT m.gate.name as gateName, m.movementType as type, COUNT(m) as count FROM MovementEvent m WHERE m.verificationStatus = 'VERIFIED' AND m.timestamp >= :since GROUP BY m.gate.name, m.movementType")
    List<Object[]> aggregateGateMovementsSince(@Param("since") OffsetDateTime since);

    long deleteByTimestampBefore(OffsetDateTime cutoff);
}
