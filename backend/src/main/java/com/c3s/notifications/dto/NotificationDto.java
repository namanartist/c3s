package com.c3s.notifications.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationDto {
    private UUID id;
    private UUID recipientId;
    private String type;
    private String title;
    private String message;
    private String priority;
    private Boolean read;
    private OffsetDateTime createdAt;
}
