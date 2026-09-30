package com.c3s.gates.controller;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.gates.dto.GateDto;
import com.c3s.gates.dto.GateQrDto;
import com.c3s.gates.service.GateService;
import com.c3s.gates.service.QrService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gates")
@RequiredArgsConstructor
@Tag(name = "Gates & QR", description = "Gate operations, daily QR codes and assignments")
@SecurityRequirement(name = "BearerAuth")
public class GateController {
    private final GateService gateService;
    private final QrService qrService;
    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "List all campus gates")
    public ApiResponse<List<GateDto>> getAllGates() {
        return ApiResponse.success(gateService.getAllActiveGates(), "Gates retrieved");
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('GATE_KEEPER', 'SUPER_ADMIN')")
    @Operation(summary = "Get gates assigned to the currently authenticated Gate Keeper")
    public ApiResponse<List<GateDto>> getMyGates(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<GateDto> myGates = gateService.getAssignedGatesForUser(currentUser.getId());
        return ApiResponse.success(myGates, "Assigned gates retrieved");
    }

    @GetMapping("/{gateId}")
    @Operation(summary = "Get specific gate details")
    public ApiResponse<GateDto> getGateById(@PathVariable UUID gateId) {
        return ApiResponse.success(gateService.getGateById(gateId), "Gate details retrieved");
    }

    @GetMapping("/{gateId}/qr")
    @PreAuthorize("hasAnyRole('GATE_KEEPER', 'CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Get the active daily QR token for a gate")
    public ApiResponse<GateQrDto> getGateQr(
            @PathVariable UUID gateId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        boolean isSuper = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_CONTROL_ROOM_OPERATOR"));
        gateService.verifyGateAccess(currentUser.getId(), gateId, isSuper);
        GateQrDto qrDto = qrService.getOrGenerateDailyQr(gateId);
        return ApiResponse.success(qrDto, "Active gate QR code retrieved");
    }

    @PostMapping("/{gateId}/qr/rotate")
    @PreAuthorize("hasAnyRole('GATE_KEEPER', 'CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Rotate and generate a fresh QR token for a gate immediately")
    public ApiResponse<GateQrDto> rotateGateQr(
            @PathVariable UUID gateId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        boolean isSuper = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_CONTROL_ROOM_OPERATOR"));
        gateService.verifyGateAccess(currentUser.getId(), gateId, isSuper);
        GateQrDto rotatedQr = qrService.rotateQr(gateId);

        auditService.log(
                currentUser.getId(),
                currentUser.getPrimaryRole(),
                "QR_ROTATED",
                "Gate",
                gateId.toString(),
                "internal",
                "C3S-API",
                "SUCCESS",
                "Rotated daily QR token version " + rotatedQr.getVersion()
        );

        return ApiResponse.success(rotatedQr, "Gate QR code rotated successfully");
    }
}
