package com.c3s.incidents.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class IncidentDto {
    private UUID id;
    private String incidentNumber;
    private UUID reportedById;
    private String reportedByName;
    private String type;
    private String priority;
    private String status;
    private Double latitude;
    private Double longitude;
    private String locationDescription;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime resolvedAt;
    private List<String> assignedPersonnelNames;
}
