package com.c3s.gates.repository;

import com.c3s.gates.entity.GateKeeperAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface GateKeeperAssignmentRepository extends JpaRepository<GateKeeperAssignment, UUID> {
    @Query("SELECT a FROM GateKeeperAssignment a WHERE a.user.id = :userId AND a.status = 'ACTIVE' AND (a.assignedUntil IS NULL OR a.assignedUntil > :now)")
    List<GateKeeperAssignment> findActiveAssignmentsForUser(@Param("userId") UUID userId, @Param("now") OffsetDateTime now);

    @Query("SELECT COUNT(a) > 0 FROM GateKeeperAssignment a WHERE a.user.id = :userId AND a.gate.id = :gateId AND a.status = 'ACTIVE' AND (a.assignedUntil IS NULL OR a.assignedUntil > :now)")
    boolean isUserAssignedToGate(@Param("userId") UUID userId, @Param("gateId") UUID gateId, @Param("now") OffsetDateTime now);
}
