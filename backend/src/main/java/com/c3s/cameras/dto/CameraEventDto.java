package com.c3s.cameras.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class CameraEventDto {
    private UUID id;
    private UUID cameraId;
    private String eventType;
    private OffsetDateTime timestamp;
    private String snapshotUrl;
    private String metadata;
}
