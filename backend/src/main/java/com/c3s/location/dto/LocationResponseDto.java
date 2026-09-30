package com.c3s.location.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class LocationResponseDto {
    private UUID id;
    private Double latitude;
    private Double longitude;
    private Double accuracy;
    private String geofenceStatus; // INSIDE, NEAR_BOUNDARY, OUTSIDE, UNKNOWN
    private OffsetDateTime timestamp;
}
