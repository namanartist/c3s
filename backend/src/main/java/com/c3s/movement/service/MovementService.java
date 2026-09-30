package com.c3s.movement.service;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.DuplicateActionException;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.gates.entity.Gate;
import com.c3s.gates.entity.GateQrToken;
import com.c3s.gates.service.QrService;
import com.c3s.movement.dto.CheckInRequest;
import com.c3s.movement.dto.CheckOutRequest;
import com.c3s.movement.dto.MovementResultDto;
import com.c3s.movement.entity.MovementEvent;
import com.c3s.movement.entity.UserCampusStatus;
import com.c3s.movement.repository.MovementEventRepository;
import com.c3s.movement.repository.UserCampusStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class MovementService {
    private final MovementEventRepository movementEventRepository;
    private final UserCampusStatusRepository campusStatusRepository;
    private final UserRepository userRepository;
    private final QrService qrService;
    private final CampusOccupancyService occupancyService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuditService auditService;

    @Transactional
    public MovementResultDto checkIn(UUID userId, CheckInRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GateQrToken qrToken = qrService.validateQr(request.getQrToken());
        Gate gate = qrToken.getGate();

        UserCampusStatus status = campusStatusRepository.findById(userId)
                .orElseGet(() -> UserCampusStatus.builder()
                        .user(user)
                        .status("OUTSIDE")
                        .lastChangedAt(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")))
                        .build());

        if ("INSIDE".equalsIgnoreCase(status.getStatus())) {
            throw new DuplicateActionException("Duplicate Check-In rejected. You are already recorded as INSIDE the campus.");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        MovementEvent event = MovementEvent.builder()
                .user(user)
                .gate(gate)
                .qrToken(qrToken)
                .movementType("CHECK_IN")
                .timestamp(now)
                .deviceId(request.getDeviceId())
                .verificationStatus("VERIFIED")
                .createdAt(now)
                .build();

        movementEventRepository.save(event);

        status.setStatus("INSIDE");
        status.setLastGate(gate);
        status.setLastMovementId(event.getId());
        status.setLastChangedAt(now);
        campusStatusRepository.save(status);

        // Audit Log
        auditService.log(userId, "STUDENT", "CHECK_IN", "Gate", gate.getId().toString(), ipAddress, userAgent, "SUCCESS", "Check-In at " + gate.getName());

        // Real-time WebSocket notifications
        broadcastMovementUpdate(event, gate);

        return MovementResultDto.builder()
                .success(true)
                .movementType("CHECK_IN")
                .gate(Map.of("code", gate.getGateCode(), "name", gate.getName()))
                .timestamp(now)
                .message("Check-in verified successfully. Welcome to campus.")
                .build();
    }

    @Transactional
    public MovementResultDto checkOut(UUID userId, CheckOutRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        GateQrToken qrToken = qrService.validateQr(request.getQrToken());
        Gate gate = qrToken.getGate();

        UserCampusStatus status = campusStatusRepository.findById(userId)
                .orElseGet(() -> UserCampusStatus.builder()
                        .user(user)
                        .status("OUTSIDE")
                        .lastChangedAt(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")))
                        .build());

        if ("OUTSIDE".equalsIgnoreCase(status.getStatus())) {
            throw new DuplicateActionException("Invalid Check-Out. You are currently recorded as OUTSIDE campus.");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        MovementEvent event = MovementEvent.builder()
                .user(user)
                .gate(gate)
                .qrToken(qrToken)
                .movementType("CHECK_OUT")
                .timestamp(now)
                .deviceId(request.getDeviceId())
                .verificationStatus("VERIFIED")
                .createdAt(now)
                .build();

        movementEventRepository.save(event);

        status.setStatus("OUTSIDE");
        status.setLastGate(gate);
        status.setLastMovementId(event.getId());
        status.setLastChangedAt(now);
        campusStatusRepository.save(status);

        // Audit Log
        auditService.log(userId, "STUDENT", "CHECK_OUT", "Gate", gate.getId().toString(), ipAddress, userAgent, "SUCCESS", "Check-Out at " + gate.getName());

        // Real-time WebSocket notifications
        broadcastMovementUpdate(event, gate);

        return MovementResultDto.builder()
                .success(true)
                .movementType("CHECK_OUT")
                .gate(Map.of("code", gate.getGateCode(), "name", gate.getName()))
                .timestamp(now)
                .message("Check-out verified successfully. Have a safe journey.")
                .build();
    }

    private void broadcastMovementUpdate(MovementEvent event, Gate gate) {
        try {
            // Push to gate topic
            messagingTemplate.convertAndSend("/topic/gates/" + gate.getId(), Map.of(
                    "type", "GATE_ACTIVITY",
                    "movementType", event.getMovementType(),
                    "userName", event.getUser().getFullName(),
                    "universityId", event.getUser().getUniversityId(),
                    "timestamp", event.getTimestamp().toString()
            ));

            // Push updated campus occupancy
            messagingTemplate.convertAndSend("/topic/occupancy", occupancyService.getOccupancy());
        } catch (Exception e) {
            log.warn("Failed to push STOMP movement event", e);
        }
    }
}
