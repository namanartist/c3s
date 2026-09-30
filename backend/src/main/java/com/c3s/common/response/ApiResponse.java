package com.c3s.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.time.ZoneId;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private OffsetDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message("Operation completed successfully")
                .timestamp(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")))
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .timestamp(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")))
                .build();
    }

    public static <T> ApiResponse<T> ok(T data) {
        return success(data);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return success(data, message);
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")))
                .build();
    }
}
