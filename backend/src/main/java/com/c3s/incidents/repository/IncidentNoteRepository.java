package com.c3s.incidents.repository;

import com.c3s.incidents.entity.IncidentNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentNoteRepository extends JpaRepository<IncidentNote, UUID> {
    List<IncidentNote> findByIncidentIdOrderByCreatedAtAsc(UUID incidentId);
}
