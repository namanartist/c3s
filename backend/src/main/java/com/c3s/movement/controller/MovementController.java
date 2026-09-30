package com.c3s.movement.controller;

import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.gates.dto.GateDto;
import com.c3s.gates.entity.GateQrToken;
import com.c3s.gates.service.GateService;
import com.c3s.gates.service.QrService;
import com.c3s.movement.dto.CheckInRequest;
import com.c3s.movement.dto.CheckOutRequest;
import com.c3s.movement.dto.MovementResultDto;
import com.c3s.movement.dto.ValidateQrRequest;
import com.c3s.movement.service.MovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movement")
@RequiredArgsConstructor
@Tag(name = "Movement Management", description = "Check-In, Check-Out and QR Validation endpoints")
@SecurityRequirement(name = "BearerAuth")
public class MovementController {
    private final MovementService movementService;
    private final QrService qrService;
    private final GateService gateService;

    @PostMapping("/check-in")
    @Operation(summary = "Check in to campus using gate daily QR token")
    public ApiResponse<MovementResultDto> checkIn(
            @Valid @RequestBody CheckInRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest
    ) {
        MovementResultDto result = movementService.checkIn(
                currentUser.getId(),
                request,
                servletRequest.getRemoteAddr(),
                servletRequest.getHeader("User-Agent")
        );
        return ApiResponse.success(result, "Check-in successful");
    }

    @PostMapping("/check-out")
    @Operation(summary = "Check out of campus using gate daily QR token")
    public ApiResponse<MovementResultDto> checkOut(
            @Valid @RequestBody CheckOutRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest
    ) {
        MovementResultDto result = movementService.checkOut(
                currentUser.getId(),
                request,
                servletRequest.getRemoteAddr(),
                servletRequest.getHeader("User-Agent")
        );
        return ApiResponse.success(result, "Check-out successful");
    }

    @PostMapping("/validate-qr")
    @Operation(summary = "Validate a scanned QR code and inspect destination gate metadata")
    public ApiResponse<GateDto> validateQr(@Valid @RequestBody ValidateQrRequest request) {
        GateQrToken token = qrService.validateQr(request.getQrToken());
        GateDto gateDto = gateService.toDto(token.getGate());
        return ApiResponse.success(gateDto, "QR token is valid and active for " + gateDto.getName());
    }
}
