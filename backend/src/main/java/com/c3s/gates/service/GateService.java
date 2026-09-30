package com.c3s.gates.service;

import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.common.exception.UnauthorizedException;
import com.c3s.gates.dto.GateDto;
import com.c3s.gates.entity.Gate;
import com.c3s.gates.entity.GateKeeperAssignment;
import com.c3s.gates.repository.GateKeeperAssignmentRepository;
import com.c3s.gates.repository.GateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class GateService {
    private final GateRepository gateRepository;
    private final GateKeeperAssignmentRepository assignmentRepository;

    @Transactional(readOnly = true)
    public List<GateDto> getAllActiveGates() {
        return gateRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GateDto getGateById(UUID gateId) {
        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new ResourceNotFoundException("Gate not found: " + gateId));
        return toDto(gate);
    }

    @Transactional(readOnly = true)
    public List<GateDto> getAssignedGatesForUser(UUID userId) {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        return assignmentRepository.findActiveAssignmentsForUser(userId, now)
                .stream()
                .map(GateKeeperAssignment::getGate)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public void verifyGateAccess(UUID userId, UUID gateId, boolean isSuperAdmin) {
        if (isSuperAdmin) return;
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        boolean assigned = assignmentRepository.isUserAssignedToGate(userId, gateId, now);
        if (!assigned) {
            throw new UnauthorizedException("You are not assigned or authorized to access this gate");
        }
    }

    public GateDto toDto(Gate gate) {
        return GateDto.builder()
                .id(gate.getId())
                .gateCode(gate.getGateCode())
                .name(gate.getName())
                .latitude(gate.getLatitude())
                .longitude(gate.getLongitude())
                .status(gate.getStatus())
                .description(gate.getDescription())
                .createdAt(gate.getCreatedAt())
                .build();
    }
}
