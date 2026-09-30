package com.c3s.incidents.service;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.incidents.dto.*;
import com.c3s.incidents.entity.Incident;
import com.c3s.incidents.entity.IncidentAssignment;
import com.c3s.incidents.entity.IncidentNote;
import com.c3s.incidents.entity.IncidentTimeline;
import com.c3s.incidents.repository.IncidentAssignmentRepository;
import com.c3s.incidents.repository.IncidentNoteRepository;
import com.c3s.incidents.repository.IncidentRepository;
import com.c3s.incidents.repository.IncidentTimelineRepository;
import com.c3s.notifications.service.NotificationService;
import com.c3s.responders.entity.SecurityPersonnel;
import com.c3s.responders.repository.SecurityPersonnelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final IncidentAssignmentRepository assignmentRepository;
    private final IncidentTimelineRepository timelineRepository;
    private final IncidentNoteRepository noteRepository;
    private final SecurityPersonnelRepository personnelRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuditService auditService;

    @Transactional
    public IncidentDto createIncident(UUID reportedById, CreateIncidentRequest request) {
        User reporter = userRepository.findById(reportedById)
                .orElseThrow(() -> new ResourceNotFoundException("Reporter not found"));

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        String incidentNumber = "INC-" + System.currentTimeMillis();

        Incident incident = Incident.builder()
                .incidentNumber(incidentNumber)
                .reportedBy(reporter)
                .type(request.getType())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .status("OPEN")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationDescription(request.getLocationDescription())
                .createdAt(now)
                .updatedAt(now)
                .build();

        incidentRepository.save(incident);

        addTimeline(incident, "CREATED", "Incident reported by " + reporter.getFullName(), reporter, now);

        IncidentDto dto = toDto(incident);
        broadcastIncident(dto);

        auditService.log(reportedById, "USER", "INCIDENT_CREATED", "Incident", incident.getId().toString(), "internal", "web", "SUCCESS", "Created incident " + incidentNumber);

        return dto;
    }

    @Transactional(readOnly = true)
    public Page<IncidentDto> getIncidents(String type, String priority, String status, Pageable pageable) {
        return incidentRepository.findWithFilters(type, priority, status, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public IncidentDto getIncidentById(UUID id) {
        return incidentRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));
    }

    @Transactional
    public IncidentDto assignResponder(UUID incidentId, UUID personnelId, UUID assignedById) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));

        SecurityPersonnel personnel = personnelRepository.findById(personnelId)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel not found: " + personnelId));

        User assignedBy = userRepository.findById(assignedById).orElse(null);
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        IncidentAssignment assignment = IncidentAssignment.builder()
                .incident(incident)
                .personnel(personnel)
                .assignedBy(assignedBy)
                .assignedAt(now)
                .status("ASSIGNED")
                .build();

        assignmentRepository.save(assignment);

        incident.setStatus("ASSIGNED");
        incident.setUpdatedAt(now);
        incidentRepository.save(incident);

        personnel.setStatus("BUSY");
        personnelRepository.save(personnel);

        addTimeline(incident, "ASSIGNED", "Assigned to " + personnel.getUser().getFullName(), assignedBy, now);

        // Notify responder
        notificationService.createAndSend(
                personnel.getUser().getId(),
                "INCIDENT",
                "Incident Assigned: " + incident.getIncidentNumber(),
                "You have been assigned to incident " + incident.getIncidentNumber() + " (" + incident.getType() + ")",
                incident.getPriority()
        );

        IncidentDto dto = toDto(incident);
        broadcastIncident(dto);
        return dto;
    }

    @Transactional
    public IncidentDto updateStatus(UUID incidentId, String newStatus, UUID userId, String details) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));

        User actor = userRepository.findById(userId).orElse(null);
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        incident.setStatus(newStatus);
        incident.setUpdatedAt(now);
        if ("RESOLVED".equalsIgnoreCase(newStatus) || "CLOSED".equalsIgnoreCase(newStatus)) {
            incident.setResolvedAt(now);
        }

        incidentRepository.save(incident);

        addTimeline(incident, newStatus, details != null ? details : "Status changed to " + newStatus, actor, now);

        IncidentDto dto = toDto(incident);
        broadcastIncident(dto);
        return dto;
    }

    @Transactional
    public void addNote(UUID incidentId, UUID authorId, String noteText) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found: " + authorId));

        IncidentNote note = IncidentNote.builder()
                .incident(incident)
                .author(author)
                .note(noteText)
                .createdAt(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")))
                .build();

        noteRepository.save(note);
    }

    private void addTimeline(Incident incident, String action, String details, User performedBy, OffsetDateTime timestamp) {
        IncidentTimeline timeline = IncidentTimeline.builder()
                .incident(incident)
                .action(action)
                .details(details)
                .performedBy(performedBy)
                .timestamp(timestamp)
                .build();
        timelineRepository.save(timeline);
    }

    private void broadcastIncident(IncidentDto dto) {
        try {
            messagingTemplate.convertAndSend("/topic/incidents", dto);
            messagingTemplate.convertAndSend("/topic/control-room", dto);
        } catch (Exception e) {
            log.warn("STOMP broadcast for incident failed", e);
        }
    }

    public IncidentDto toDto(Incident i) {
        List<String> assigned = assignmentRepository.findByIncidentId(i.getId()).stream()
                .map(a -> a.getPersonnel().getUser().getFullName())
                .collect(Collectors.toList());

        return IncidentDto.builder()
                .id(i.getId())
                .incidentNumber(i.getIncidentNumber())
                .reportedById(i.getReportedBy().getId())
                .reportedByName(i.getReportedBy().getFullName())
                .type(i.getType())
                .priority(i.getPriority())
                .status(i.getStatus())
                .latitude(i.getLatitude())
                .longitude(i.getLongitude())
                .locationDescription(i.getLocationDescription())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .resolvedAt(i.getResolvedAt())
                .assignedPersonnelNames(assigned)
                .build();
    }
}
