package com.c3s.incidents.repository;

import com.c3s.incidents.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    Optional<Incident> findByIncidentNumber(String incidentNumber);

    @Query("SELECT i FROM Incident i WHERE (:type IS NULL OR i.type = :type) AND (:priority IS NULL OR i.priority = :priority) AND (:status IS NULL OR i.status = :status) ORDER BY i.createdAt DESC")
    Page<Incident> findWithFilters(@Param("type") String type, @Param("priority") String priority, @Param("status") String status, Pageable pageable);

    long countByStatus(String status);
    long countByCreatedAtAfter(OffsetDateTime date);

    @Query("SELECT i.type as type, COUNT(i) as count FROM Incident i WHERE i.createdAt >= :since GROUP BY i.type")
    List<Object[]> countGroupedByTypeSince(@Param("since") OffsetDateTime since);
}
