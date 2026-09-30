package com.c3s.gates.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class GateDto {
    private UUID id;
    private String gateCode;
    private String name;
    private Double latitude;
    private Double longitude;
    private String status;
    private String description;
    private OffsetDateTime createdAt;
}
