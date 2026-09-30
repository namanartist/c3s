package com.c3s.incidents.controller;

import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.incidents.dto.*;
import com.c3s.incidents.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@Tag(name = "Incident Management", description = "Campus security incidents lifecycle and triage")
@SecurityRequirement(name = "BearerAuth")
public class IncidentController {
    private final IncidentService incidentService;

    @GetMapping
    @Operation(summary = "List incidents with filtering")
    public ApiResponse<Page<IncidentDto>> getIncidents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<IncidentDto> results = incidentService.getIncidents(type, priority, status, PageRequest.of(page, size));
        return ApiResponse.success(results, "Incidents retrieved");
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific incident details")
    public ApiResponse<IncidentDto> getIncidentById(@PathVariable UUID id) {
        return ApiResponse.success(incidentService.getIncidentById(id), "Incident details retrieved");
    }

    @PostMapping
    @Operation(summary = "Report a new campus incident")
    public ApiResponse<IncidentDto> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        IncidentDto created = incidentService.createIncident(currentUser.getId(), request);
        return ApiResponse.success(created, "Incident reported successfully");
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Assign a security guard or responder to the incident")
    public ApiResponse<IncidentDto> assignIncident(
            @PathVariable UUID id,
            @Valid @RequestBody AssignIncidentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        IncidentDto dto = incidentService.assignResponder(id, request.getPersonnelId(), currentUser.getId());
        return ApiResponse.success(dto, "Responder assigned");
    }

    @PostMapping("/{id}/acknowledge")
    @Operation(summary = "Acknowledge incident")
    public ApiResponse<IncidentDto> acknowledge(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal currentUser) {
        return ApiResponse.success(incidentService.updateStatus(id, "ACKNOWLEDGED", currentUser.getId(), "Incident acknowledged"), "Acknowledged");
    }

    @PostMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Escalate incident priority")
    public ApiResponse<IncidentDto> escalate(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal currentUser) {
        return ApiResponse.success(incidentService.updateStatus(id, "INVESTIGATING", currentUser.getId(), "Escalated to Control Room"), "Escalated");
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Mark incident as resolved")
    public ApiResponse<IncidentDto> resolve(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal currentUser) {
        return ApiResponse.success(incidentService.updateStatus(id, "RESOLVED", currentUser.getId(), "Incident resolved"), "Resolved");
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Close incident investigation")
    public ApiResponse<IncidentDto> close(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal currentUser) {
        return ApiResponse.success(incidentService.updateStatus(id, "CLOSED", currentUser.getId(), "Case closed"), "Closed");
    }

    @PostMapping("/{id}/notes")
    @Operation(summary = "Add an investigative note to the incident")
    public ApiResponse<Void> addNote(
            @PathVariable UUID id,
            @Valid @RequestBody IncidentNoteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        incidentService.addNote(id, currentUser.getId(), request.getNote());
        return ApiResponse.<Void>success(null, "Note added");
    }
}
