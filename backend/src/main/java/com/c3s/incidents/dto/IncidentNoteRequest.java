package com.c3s.incidents.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IncidentNoteRequest {
    @NotBlank(message = "Note content cannot be empty")
    private String note;
}
