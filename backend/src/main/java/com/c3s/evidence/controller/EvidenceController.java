package com.c3s.evidence.controller;

import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.evidence.dto.EvidenceDto;
import com.c3s.evidence.service.EvidenceStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
@Tag(name = "Evidence Management", description = "Chain-of-custody secure incident files and photos")
@SecurityRequirement(name = "BearerAuth")
public class EvidenceController {
    private final EvidenceStorageService evidenceStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Upload and register an evidence artifact for an incident")
    public ApiResponse<EvidenceDto> uploadEvidence(
            @RequestParam UUID incidentId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) throws IOException {
        EvidenceDto dto = evidenceStorageService.storeEvidence(incidentId, currentUser.getId(), file);
        return ApiResponse.success(dto, "Evidence registered and hashed successfully");
    }

    @GetMapping("/incident/{incidentId}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'PROCTOR')")
    @Operation(summary = "List evidence registered for an incident")
    public ApiResponse<List<EvidenceDto>> getEvidenceForIncident(@PathVariable UUID incidentId) {
        return ApiResponse.success(evidenceStorageService.getEvidenceForIncident(incidentId), "Evidence files retrieved");
    }
}
