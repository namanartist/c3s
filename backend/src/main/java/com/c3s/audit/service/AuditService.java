package com.c3s.audit.service;

import com.c3s.audit.dto.AuditLogDto;
import com.c3s.audit.entity.AuditLog;
import com.c3s.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    @Async
    @Transactional
    public void log(UUID actorId, String actorRole, String action, String resourceType, String resourceId, String ipAddress, String userAgent, String result, String metadata) {
        try {
            AuditLog record = AuditLog.builder()
                    .actorId(actorId)
                    .actorRole(actorRole)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .timestamp(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")))
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .result(result)
                    .metadata(metadata)
                    .build();
            auditLogRepository.save(record);
        } catch (Exception e) {
            log.error("Failed to write audit log for action: {}", action, e);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(String action, String role, OffsetDateTime since, Pageable pageable) {
        if (since == null) {
            since = OffsetDateTime.now(ZoneId.of("Asia/Kolkata")).minusDays(30);
        }
        return auditLogRepository.findFiltered(action, role, since, pageable).map(this::toDto);
    }

    public AuditLogDto toDto(AuditLog entity) {
        return AuditLogDto.builder()
                .id(entity.getId())
                .actorId(entity.getActorId())
                .actorRole(entity.getActorRole())
                .action(entity.getAction())
                .resourceType(entity.getResourceType())
                .resourceId(entity.getResourceId())
                .timestamp(entity.getTimestamp())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .result(entity.getResult())
                .metadata(entity.getMetadata())
                .build();
    }
}
