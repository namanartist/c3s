package com.c3s.sos.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SosEventDto {
    private UUID id;
    private UUID incidentId;
    private String incidentNumber;
    private UUID userId;
    private String studentName;
    private String universityId;
    private String phone;
    private Double latitude;
    private Double longitude;
    private Double accuracy;
    private String status;
    private OffsetDateTime triggeredAt;
    private OffsetDateTime resolvedAt;
}
