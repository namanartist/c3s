package com.c3s.emergency.repository;

import com.c3s.emergency.entity.EmergencyOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmergencyOverrideRepository extends JpaRepository<EmergencyOverride, UUID> {
    List<EmergencyOverride> findByStatus(String status);
}
