package com.c3s.notifications.service;

import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.notifications.dto.NotificationDto;
import com.c3s.notifications.entity.Notification;
import com.c3s.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationDto createAndSend(UUID recipientId, String type, String title, String message, String priority) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found: " + recipientId));

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .priority(priority != null ? priority : "MEDIUM")
                .read(false)
                .createdAt(now)
                .build();

        notificationRepository.save(notification);
        NotificationDto dto = toDto(notification);

        // Push real-time notification to user's private STOMP topic
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + recipientId, dto);
        } catch (Exception e) {
            log.warn("Could not dispatch STOMP notification for user: {}", recipientId, e);
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(UUID recipientId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable).map(this::toDto);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (notification.getRecipient().getId().equals(recipientId)) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(UUID recipientId) {
        notificationRepository.markAllAsReadForUser(recipientId);
    }

    public NotificationDto toDto(Notification entity) {
        return NotificationDto.builder()
                .id(entity.getId())
                .recipientId(entity.getRecipient().getId())
                .type(entity.getType())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .priority(entity.getPriority())
                .read(entity.getRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
