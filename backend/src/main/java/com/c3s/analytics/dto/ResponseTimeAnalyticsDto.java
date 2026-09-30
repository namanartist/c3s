package com.c3s.analytics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResponseTimeAnalyticsDto {
    private double averageMinutesToAcknowledge;
    private double averageMinutesToArrive;
    private double averageMinutesToResolve;
}
