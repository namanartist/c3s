package com.c3s.emergency.controller;

import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.emergency.dto.EmergencyOverrideDto;
import com.c3s.emergency.dto.EmergencyOverrideRequest;
import com.c3s.emergency.service.EmergencyOverrideService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency/override")
@RequiredArgsConstructor
@Tag(name = "Emergency Protocol & Overrides", description = "Campus lockdown, evacuation and gate emergency closures")
@SecurityRequirement(name = "BearerAuth")
public class EmergencyOverrideController {
    private final EmergencyOverrideService overrideService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Initiate an emergency protocol or gate override")
    public ApiResponse<EmergencyOverrideDto> initiate(
            @Valid @RequestBody EmergencyOverrideRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest
    ) {
        EmergencyOverrideDto dto = overrideService.initiateOverride(
                currentUser.getId(),
                request,
                servletRequest.getRemoteAddr(),
                servletRequest.getHeader("User-Agent")
        );
        return ApiResponse.success(dto, "Emergency override initiated");
    }

    @GetMapping("/active")
    @Operation(summary = "List currently active emergency overrides")
    public ApiResponse<List<EmergencyOverrideDto>> getActiveOverrides() {
        return ApiResponse.success(overrideService.getActiveOverrides(), "Active emergency overrides");
    }
}
