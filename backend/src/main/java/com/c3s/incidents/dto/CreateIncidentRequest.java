package com.c3s.incidents.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateIncidentRequest {
    @NotBlank(message = "Incident type is required")
    private String type;

    private String priority; // Default MEDIUM
    private Double latitude;
    private Double longitude;
    private String locationDescription;
}
