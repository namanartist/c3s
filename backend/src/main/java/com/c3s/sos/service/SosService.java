package com.c3s.sos.service;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.DuplicateActionException;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.incidents.entity.Incident;
import com.c3s.incidents.entity.IncidentTimeline;
import com.c3s.incidents.repository.IncidentRepository;
import com.c3s.incidents.repository.IncidentTimelineRepository;
import com.c3s.notifications.service.NotificationService;
import com.c3s.responders.entity.SecurityPersonnel;
import com.c3s.responders.repository.SecurityPersonnelRepository;
import com.c3s.sos.dto.SosEventDto;
import com.c3s.sos.dto.SosRequest;
import com.c3s.sos.entity.SosEvent;
import com.c3s.sos.repository.SosEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class SosService {
    private final SosEventRepository sosEventRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentTimelineRepository timelineRepository;
    private final SecurityPersonnelRepository personnelRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuditService auditService;

    @Transactional
    public SosEventDto triggerSos(UUID userId, SosRequest request, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Idempotency: Reject if already has active unclosed SOS
        sosEventRepository.findActiveSosByUser(userId).ifPresent(s -> {
            throw new DuplicateActionException("An active SOS alert is already in progress for your account.");
        });

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        String incidentNum = "SOS-" + System.currentTimeMillis();

        // 1. Create Critical Incident
        Incident incident = Incident.builder()
                .incidentNumber(incidentNum)
                .reportedBy(user)
                .type("EMERGENCY_SOS")
                .priority("CRITICAL")
                .status("OPEN")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationDescription("Triggered via Student Mobile App SOS Button")
                .createdAt(now)
                .updatedAt(now)
                .build();
        incidentRepository.save(incident);

        // 2. Create SOS Event
        SosEvent sos = SosEvent.builder()
                .incident(incident)
                .user(user)
                .triggeredAt(now)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .status("TRIGGERED")
                .build();
        sosEventRepository.save(sos);

        // 3. Incident Timeline
        IncidentTimeline timeline = IncidentTimeline.builder()
                .incident(incident)
                .action("SOS_TRIGGERED")
                .details("Student " + user.getFullName() + " triggered emergency SOS (GPS: " + request.getLatitude() + ", " + request.getLongitude() + ")")
                .performedBy(user)
                .timestamp(now)
                .build();
        timelineRepository.save(timeline);

        // 4. Audit Log
        auditService.log(
                userId,
                "STUDENT",
                "SOS_TRIGGERED",
                "SosEvent",
                sos.getId() != null ? sos.getId().toString() : "SOS-NEW",
                ipAddress,
                userAgent,
                "CRITICAL",
                "SOS event activated"
        );

        SosEventDto dto = toDto(sos);

        // 5. Notify Control Room & Broadcast to STOMP
        try {
            messagingTemplate.convertAndSend("/topic/alerts", dto);
            messagingTemplate.convertAndSend("/topic/control-room", dto);
            messagingTemplate.convertAndSend("/topic/incidents", dto);
        } catch (Exception e) {
            log.warn("Failed to broadcast SOS via WebSocket", e);
        }

        // 6. Notify Available Responders & Control Room Operators
        List<SecurityPersonnel> guards = personnelRepository.findByStatus("AVAILABLE");
        for (SecurityPersonnel guard : guards) {
            notificationService.createAndSend(
                    guard.getUser().getId(),
                    "SOS",
                    "CRITICAL SOS: " + user.getFullName(),
                    "Immediate response required at coordinates " + request.getLatitude() + ", " + request.getLongitude(),
                    "CRITICAL"
            );
        }

        return dto;
    }

    public SosEventDto toDto(SosEvent s) {
        return SosEventDto.builder()
                .id(s.getId())
                .incidentId(s.getIncident().getId())
                .incidentNumber(s.getIncident().getIncidentNumber())
                .userId(s.getUser().getId())
                .studentName(s.getUser().getFullName())
                .universityId(s.getUser().getUniversityId())
                .phone(s.getUser().getPhone())
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .accuracy(s.getAccuracy())
                .status(s.getStatus())
                .triggeredAt(s.getTriggeredAt())
                .resolvedAt(s.getResolvedAt())
                .build();
    }
}
