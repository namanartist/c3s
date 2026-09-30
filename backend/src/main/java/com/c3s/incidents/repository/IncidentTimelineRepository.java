package com.c3s.incidents.repository;

import com.c3s.incidents.entity.IncidentTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentTimelineRepository extends JpaRepository<IncidentTimeline, UUID> {
    List<IncidentTimeline> findByIncidentIdOrderByTimestampAsc(UUID incidentId);
}
