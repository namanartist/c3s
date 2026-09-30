package com.c3s.scheduler;

import com.c3s.audit.repository.AuditLogRepository;
import com.c3s.cameras.repository.CameraEventRepository;
import com.c3s.location.repository.LocationUpdateRepository;
import com.c3s.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
@Slf4j
public class RetentionCleanupScheduler {
    private final LocationUpdateRepository locationUpdateRepository;
    private final NotificationRepository notificationRepository;
    private final CameraEventRepository cameraEventRepository;
    private final AuditLogRepository auditLogRepository;

    // Runs every Sunday at 02:00 AM IST to enforce data retention
    @Scheduled(cron = "0 0 2 ? * SUN", zone = "Asia/Kolkata")
    public void executeRetentionPolicy() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        // Retain GPS location updates for 30 days
        OffsetDateTime locationCutoff = now.minusDays(30);
        long deletedLocs = locationUpdateRepository.deleteByTimestampBefore(locationCutoff);
        log.info("Retention policy: purged {} location records older than 30 days", deletedLocs);

        // Retain read notifications for 60 days
        OffsetDateTime notifCutoff = now.minusDays(60);
        long deletedNotifs = notificationRepository.deleteByCreatedAtBefore(notifCutoff);
        log.info("Retention policy: purged {} notifications older than 60 days", deletedNotifs);

        // Retain camera motion detection events for 14 days
        OffsetDateTime cameraCutoff = now.minusDays(14);
        long deletedCamEvents = cameraEventRepository.deleteByTimestampBefore(cameraCutoff);
        log.info("Retention policy: purged {} camera events older than 14 days", deletedCamEvents);

        // Retain audit logs for 365 days
        OffsetDateTime auditCutoff = now.minusDays(365);
        long deletedAudits = auditLogRepository.deleteByTimestampBefore(auditCutoff);
        log.info("Retention policy: purged {} audit records older than 365 days", deletedAudits);
    }
}
