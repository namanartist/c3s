package com.c3s.evidence.repository;

import com.c3s.evidence.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, UUID> {
    List<Evidence> findByIncidentId(UUID incidentId);
}
