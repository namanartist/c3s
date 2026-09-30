package com.c3s.responders.controller;

import com.c3s.common.response.ApiResponse;
import com.c3s.responders.dto.SecurityPersonnelDto;
import com.c3s.responders.service.ResponderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/responders")
@RequiredArgsConstructor
@Tag(name = "Security Personnel", description = "Responders, guards, and status monitoring")
@SecurityRequirement(name = "BearerAuth")
public class ResponderController {
    private final ResponderService responderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'SECURITY_GUARD')")
    @Operation(summary = "List all registered security personnel")
    public ApiResponse<List<SecurityPersonnelDto>> getAll() {
        return ApiResponse.success(responderService.getAllPersonnel(), "Responders retrieved");
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "List available responders for dispatch")
    public ApiResponse<List<SecurityPersonnelDto>> getAvailable() {
        return ApiResponse.success(responderService.getAvailableResponders(), "Available responders retrieved");
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Update responder duty status")
    public ApiResponse<SecurityPersonnelDto> updateStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) String location
    ) {
        return ApiResponse.success(responderService.updateStatus(id, status, location), "Status updated");
    }
}
