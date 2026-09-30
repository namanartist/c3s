package com.c3s.incidents.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class AssignIncidentRequest {
    @NotNull(message = "Personnel ID is required")
    private UUID personnelId;
}
