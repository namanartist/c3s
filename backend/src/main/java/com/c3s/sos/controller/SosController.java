package com.c3s.sos.controller;

import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.sos.dto.SosEventDto;
import com.c3s.sos.dto.SosRequest;
import com.c3s.sos.service.SosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
@Tag(name = "Emergency SOS", description = "Instant distress alert and campus responder dispatch")
@SecurityRequirement(name = "BearerAuth")
public class SosController {
    private final SosService sosService;

    @PostMapping
    @Operation(summary = "Trigger emergency distress SOS broadcast")
    public ApiResponse<SosEventDto> triggerSos(
            @Valid @RequestBody SosRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest
    ) {
        SosEventDto event = sosService.triggerSos(
                currentUser.getId(),
                request,
                servletRequest.getRemoteAddr(),
                servletRequest.getHeader("User-Agent")
        );
        return ApiResponse.success(event, "Emergency SOS triggered. Campus response team notified immediately.");
    }
}
