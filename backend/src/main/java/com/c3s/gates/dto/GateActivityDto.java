package com.c3s.gates.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class GateActivityDto {
    private UUID id;
    private String universityId;
    private String userName;
    private String movementType;
    private OffsetDateTime timestamp;
    private String verificationStatus;
}
