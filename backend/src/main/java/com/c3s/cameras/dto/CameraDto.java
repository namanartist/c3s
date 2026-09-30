package com.c3s.cameras.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CameraDto {
    private UUID id;
    private String cameraCode;
    private String name;
    private String gateCode;
    private String building;
    private Double latitude;
    private Double longitude;
    private String status;
    private String streamReference;
    private OffsetDateTime lastHeartbeat;
}
