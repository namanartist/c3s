package com.c3s.audit.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class AuditLogDto {
    private UUID id;
    private UUID actorId;
    private String actorRole;
    private String action;
    private String resourceType;
    private String resourceId;
    private OffsetDateTime timestamp;
    private String ipAddress;
    private String userAgent;
    private String result;
    private String metadata;
}
