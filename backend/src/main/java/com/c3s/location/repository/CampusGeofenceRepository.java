package com.c3s.location.repository;

import com.c3s.location.entity.CampusGeofence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CampusGeofenceRepository extends JpaRepository<CampusGeofence, UUID> {
    List<CampusGeofence> findByActiveTrue();
}
