package com.c3s.location.controller;

import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.location.dto.LocationResponseDto;
import com.c3s.location.dto.LocationUpdateRequest;
import com.c3s.location.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
@Tag(name = "Location & Geofencing", description = "User location telemetry and campus boundary verification")
@SecurityRequirement(name = "BearerAuth")
public class LocationController {
    private final LocationService locationService;

    @PostMapping("/update")
    @Operation(summary = "Submit authenticated user's GPS coordinates")
    public ApiResponse<LocationResponseDto> updateLocation(
            @Valid @RequestBody LocationUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        LocationResponseDto response = locationService.recordLocation(currentUser.getId(), request);
        return ApiResponse.success(response, "Location updated successfully");
    }

    @GetMapping("/me")
    @Operation(summary = "Get user's last recorded location status")
    public ApiResponse<LocationResponseDto> getMyLocation(@AuthenticationPrincipal UserPrincipal currentUser) {
        LocationResponseDto response = locationService.getLatestLocation(currentUser.getId());
        return ApiResponse.success(response, "Latest location retrieved");
    }
}
