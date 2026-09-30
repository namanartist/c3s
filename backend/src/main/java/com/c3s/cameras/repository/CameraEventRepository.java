package com.c3s.cameras.repository;

import com.c3s.cameras.entity.CameraEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CameraEventRepository extends JpaRepository<CameraEvent, UUID> {
    List<CameraEvent> findByCameraIdOrderByTimestampDesc(UUID cameraId);
    long deleteByTimestampBefore(OffsetDateTime cutoff);
}
