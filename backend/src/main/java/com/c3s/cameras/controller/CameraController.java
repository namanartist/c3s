package com.c3s.cameras.controller;

import com.c3s.cameras.dto.CameraDto;
import com.c3s.cameras.dto.CameraEventDto;
import com.c3s.cameras.service.CameraService;
import com.c3s.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cameras")
@RequiredArgsConstructor
@Tag(name = "CCTV Surveillance", description = "Camera telemetry, feed metadata and motion detection events")
@SecurityRequirement(name = "BearerAuth")
public class CameraController {
    private final CameraService cameraService;

    @GetMapping
    @Operation(summary = "List all campus security cameras")
    public ApiResponse<List<CameraDto>> getAll() {
        return ApiResponse.success(cameraService.getAllCameras(), "Cameras retrieved");
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific camera information")
    public ApiResponse<CameraDto> getById(@PathVariable UUID id) {
        return ApiResponse.success(cameraService.getCameraById(id), "Camera retrieved");
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('CONTROL_ROOM_OPERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Update camera status or maintenance state")
    public ApiResponse<CameraDto> updateStatus(@PathVariable UUID id, @RequestParam String status) {
        return ApiResponse.success(cameraService.updateCameraStatus(id, status), "Camera status updated");
    }

    @GetMapping("/{id}/events")
    @Operation(summary = "Get motion/intrusion events logged for camera")
    public ApiResponse<List<CameraEventDto>> getEvents(@PathVariable UUID id) {
        return ApiResponse.success(cameraService.getCameraEvents(id), "Events retrieved");
    }
}
