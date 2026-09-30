package com.c3s.emergency.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class EmergencyOverrideDto {
    private UUID id;
    private String overrideType;
    private String reason;
    private String gateName;
    private String initiatedByName;
    private OffsetDateTime startedAt;
    private OffsetDateTime expiresAt;
    private String status;
}
