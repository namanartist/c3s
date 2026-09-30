package com.c3s.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class EmergencyOverrideRequest {
    @NotBlank(message = "Override type is required")
    private String overrideType; // CAMPUS_LOCKDOWN, EVACUATION, EMERGENCY_EXIT, GATE_CLOSURE

    private UUID gateId; // null implies campus-wide

    @NotBlank(message = "Reason is required")
    private String reason;

    private OffsetDateTime expiresAt;
}
