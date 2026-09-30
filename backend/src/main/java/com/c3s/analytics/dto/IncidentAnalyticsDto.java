package com.c3s.analytics.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class IncidentAnalyticsDto {
    private long openCount;
    private long resolvedCount;
    private long criticalCount;
    private Map<String, Long> incidentsByType;
}
