package com.c3s.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    @Builder.Default
    private boolean success = false;
    private String errorCode;
    private String message;
    private OffsetDateTime timestamp;
    private String path;
    private Map<String, String> validationErrors;
}