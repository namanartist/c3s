package com.c3s.notifications.controller;

import com.c3s.auth.security.UserPrincipal;
import com.c3s.common.response.ApiResponse;
import com.c3s.notifications.dto.NotificationDto;
import com.c3s.notifications.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app real-time notification alerts")
@SecurityRequirement(name = "BearerAuth")
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get current authenticated user's notification list")
    public ApiResponse<Page<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<NotificationDto> notifications = notificationService.getUserNotifications(
                currentUser.getId(),
                PageRequest.of(page, size)
        );
        return ApiResponse.success(notifications, "Notifications retrieved");
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ApiResponse<Void> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        notificationService.markAsRead(id, currentUser.getId());
        return ApiResponse.<Void>success(null, "Notification marked as read");
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for current user")
    public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal UserPrincipal currentUser) {
        notificationService.markAllAsRead(currentUser.getId());
        return ApiResponse.<Void>success(null, "All notifications marked as read");
    }
}
