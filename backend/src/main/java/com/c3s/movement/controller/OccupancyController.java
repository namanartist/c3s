package com.c3s.movement.controller;

import com.c3s.common.response.ApiResponse;
import com.c3s.movement.dto.CampusOccupancyDto;
import com.c3s.movement.service.CampusOccupancyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Campus Occupancy", description = "Real-time derived campus and gate occupancy statistics")
public class OccupancyController {
    private final CampusOccupancyService occupancyService;

    @GetMapping("/campus/occupancy")
    @Operation(summary = "Get overall campus occupancy and gate check-in/out breakdown")
    public ApiResponse<CampusOccupancyDto> getCampusOccupancy() {
        return ApiResponse.success(occupancyService.getOccupancy(), "Occupancy statistics retrieved");
    }

    @GetMapping("/gates/{gateId}/occupancy")
    @Operation(summary = "Get occupancy for a specific gate")
    public ApiResponse<CampusOccupancyDto.GateOccupancyBreakdown> getGateOccupancy(@PathVariable UUID gateId) {
        CampusOccupancyDto overall = occupancyService.getOccupancy();
        return overall.getGates().stream()
                .filter(b -> b.getGate() != null)
                .findFirst()
                .map(b -> ApiResponse.success(b, "Gate occupancy"))
                .orElseGet(() -> ApiResponse.<CampusOccupancyDto.GateOccupancyBreakdown>success(null, "No data"));
    }
}
