package com.c3s.gates.repository;

import com.c3s.gates.entity.Gate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GateRepository extends JpaRepository<Gate, UUID> {
    Optional<Gate> findByGateCode(String gateCode);
    List<Gate> findByStatus(String status);
}
