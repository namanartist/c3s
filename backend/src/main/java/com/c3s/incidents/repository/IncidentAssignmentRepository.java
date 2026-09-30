package com.c3s.incidents.repository;

import com.c3s.incidents.entity.IncidentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentAssignmentRepository extends JpaRepository<IncidentAssignment, UUID> {
    List<IncidentAssignment> findByIncidentId(UUID incidentId);
    List<IncidentAssignment> findByPersonnelId(UUID personnelId);
}
