package com.c3s.analytics.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class GateAnalyticsDto {
    private long totalDailyEntries;
    private long totalDailyExits;
    private Map<String, Long> entriesByGate;
    private Map<String, Long> exitsByGate;
    private List<HourlyTrafficPoint> hourlyTraffic;

    @Data
    @Builder
    public static class HourlyTrafficPoint {
        private String hour;
        private long entries;
        private long exits;
    }
}
