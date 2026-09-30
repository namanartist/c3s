package com.c3s.audit.controller;

import com.c3s.audit.dto.AuditLogDto;
import com.c3s.audit.service.AuditService;
import com.c3s.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "System and security audit trail")
@SecurityRequirement(name = "BearerAuth")
public class AuditController {
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CONTROL_ROOM_OPERATOR', 'DEAN')")
    @Operation(summary = "Query audit records with optional filters")
    public ApiResponse<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime since,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogDto> results = auditService.getAuditLogs(action, role, since, PageRequest.of(page, size));
        return ApiResponse.success(results, "Audit records retrieved successfully");
    }
}
