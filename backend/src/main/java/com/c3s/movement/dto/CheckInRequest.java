package com.c3s.movement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckInRequest {
    @NotBlank(message = "QR Token payload is required")
    private String qrToken;

    private String deviceId;
}
