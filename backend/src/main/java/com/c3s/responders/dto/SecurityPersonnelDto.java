package com.c3s.responders.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SecurityPersonnelDto {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String phone;
    private String employeeCode;
    private String designation;
    private String status;
    private String currentLocation;
    private OffsetDateTime lastSeen;
}
