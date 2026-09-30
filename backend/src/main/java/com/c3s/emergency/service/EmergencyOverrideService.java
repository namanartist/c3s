package com.c3s.emergency.service;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.emergency.dto.EmergencyOverrideDto;
import com.c3s.emergency.dto.EmergencyOverrideRequest;
import com.c3s.emergency.entity.EmergencyOverride;
import com.c3s.emergency.repository.EmergencyOverrideRepository;
import com.c3s.gates.entity.Gate;
import com.c3s.gates.repository.GateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class EmergencyOverrideService {
    private final EmergencyOverrideRepository overrideRepository;
    private final GateRepository gateRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public EmergencyOverrideDto initiateOverride(UUID userId, EmergencyOverrideRequest request, String ipAddress, String userAgent) {
        User initiator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Gate gate = null;
        if (request.getGateId() != null) {
            gate = gateRepository.findById(request.getGateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Gate not found: " + request.getGateId()));
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        EmergencyOverride override = EmergencyOverride.builder()
                .initiatedBy(initiator)
                .overrideType(request.getOverrideType())
                .gate(gate)
                .reason(request.getReason())
                .startedAt(now)
                .expiresAt(request.getExpiresAt())
                .status("ACTIVE")
                .createdAt(now)
                .build();

        overrideRepository.save(override);

        auditService.log(
                userId,
                "CONTROL_ROOM_OPERATOR",
                "EMERGENCY_OVERRIDE",
                "EmergencyOverride",
                override.getId().toString(),
                ipAddress,
                userAgent,
                "CRITICAL",
                "Emergency override initiated: " + request.getOverrideType() + " - " + request.getReason()
        );

        EmergencyOverrideDto dto = toDto(override);

        // Push real-time broadcast to control room and alerts
        try {
            messagingTemplate.convertAndSend("/topic/alerts", Map.of(
                    "type", "EMERGENCY_OVERRIDE",
                    "overrideType", request.getOverrideType(),
                    "reason", request.getReason(),
                    "startedAt", now.toString()
            ));
        } catch (Exception e) {
            log.warn("Failed to broadcast emergency override", e);
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<EmergencyOverrideDto> getActiveOverrides() {
        return overrideRepository.findByStatus("ACTIVE").stream().map(this::toDto).collect(Collectors.toList());
    }

    public EmergencyOverrideDto toDto(EmergencyOverride o) {
        return EmergencyOverrideDto.builder()
                .id(o.getId())
                .overrideType(o.getOverrideType())
                .reason(o.getReason())
                .gateName(o.getGate() != null ? o.getGate().getName() : "CAMPUS-WIDE")
                .initiatedByName(o.getInitiatedBy().getFullName())
                .startedAt(o.getStartedAt())
                .expiresAt(o.getExpiresAt())
                .status(o.getStatus())
                .build();
    }
}
