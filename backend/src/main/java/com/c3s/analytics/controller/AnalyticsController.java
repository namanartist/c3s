package com.c3s.analytics.controller;

import com.c3s.analytics.dto.GateAnalyticsDto;
import com.c3s.analytics.dto.IncidentAnalyticsDto;
import com.c3s.analytics.dto.ResponseTimeAnalyticsDto;
import com.c3s.analytics.service.AnalyticsService;
import com.c3s.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics & Reports", description = "Movement, gate utilization and emergency response time statistics")
@SecurityRequirement(name = "BearerAuth")
@PreAuthorize("hasAnyRole('CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN', 'DEAN', 'HOD')")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/gates")
    @Operation(summary = "Get daily gate movement and entry/exit analytics")
    public ApiResponse<GateAnalyticsDto> getGateAnalytics() {
        return ApiResponse.success(analyticsService.getGateAnalytics(), "Gate analytics retrieved");
    }

    @GetMapping("/incidents")
    @Operation(summary = "Get incident volume and categorization analytics")
    public ApiResponse<IncidentAnalyticsDto> getIncidentAnalytics() {
        return ApiResponse.success(analyticsService.getIncidentAnalytics(), "Incident analytics retrieved");
    }

    @GetMapping("/response-time")
    @Operation(summary = "Get responder arrival and resolution velocity analytics")
    public ApiResponse<ResponseTimeAnalyticsDto> getResponseTimes() {
        return ApiResponse.success(analyticsService.getResponseTimeAnalytics(), "Response times retrieved");
    }
}
