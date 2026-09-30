package com.c3s.cameras.repository;

import com.c3s.cameras.entity.Camera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CameraRepository extends JpaRepository<Camera, UUID> {
    List<Camera> findByStatus(String status);
}
