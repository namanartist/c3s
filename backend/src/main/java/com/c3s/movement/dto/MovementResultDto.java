package com.c3s.movement.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
public class MovementResultDto {
    private boolean success;
    private String movementType;
    private Map<String, String> gate;
    private OffsetDateTime timestamp;
    private String message;
}
