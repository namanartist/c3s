package com.c3s.movement.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CampusOccupancyDto {
    private long totalInside;
    private List<GateOccupancyBreakdown> gates;

    @Data
    @Builder
    public static class GateOccupancyBreakdown {
        private String gate;
        private long checkIns;
        private long checkOuts;
    }
}
