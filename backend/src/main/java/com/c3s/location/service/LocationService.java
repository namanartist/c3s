package com.c3s.location.service;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.location.dto.LocationResponseDto;
import com.c3s.location.dto.LocationUpdateRequest;
import com.c3s.location.entity.LocationSession;
import com.c3s.location.entity.LocationUpdate;
import com.c3s.location.repository.LocationSessionRepository;
import com.c3s.location.repository.LocationUpdateRepository;
import com.c3s.movement.repository.UserCampusStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class LocationService {
    private final LocationUpdateRepository locationUpdateRepository;
    private final LocationSessionRepository locationSessionRepository;
    private final UserCampusStatusRepository userCampusStatusRepository;
    private final UserRepository userRepository;
    private final GeofenceService geofenceService;
    private final AuditService auditService;

    @Transactional
    public LocationResponseDto recordLocation(UUID userId, LocationUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        // Get or start active location session
        LocationSession session = locationSessionRepository.findActiveSessionForUser(userId)
                .orElseGet(() -> {
                    LocationSession newSession = LocationSession.builder()
                            .user(user)
                            .startedAt(now)
                            .status("ACTIVE")
                            .reason("CAMPUS_PRESENCE")
                            .build();
                    return locationSessionRepository.save(newSession);
                });

        LocationUpdate update = LocationUpdate.builder()
                .user(user)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .provider(request.getProvider())
                .timestamp(now)
                .sessionId(session.getId())
                .createdAt(now)
                .build();

        locationUpdateRepository.save(update);

        String geofenceStatus = geofenceService.evaluateLocation(request.getLatitude(), request.getLongitude());

        // Check for Location Consistency: if user is logged INSIDE, but reliable GPS says OUTSIDE
        userCampusStatusRepository.findById(userId).ifPresent(status -> {
            if ("INSIDE".equalsIgnoreCase(status.getStatus()) && "OUTSIDE".equalsIgnoreCase(geofenceStatus)) {
                if (request.getAccuracy() != null && request.getAccuracy() <= 25.0) {
                    auditService.log(
                            userId,
                            "STUDENT",
                            "LOCATION_CONSISTENCY",
                            "LocationUpdate",
                            update.getId().toString(),
                            "GPS",
                            request.getProvider(),
                            "WARNING",
                            "Movement status is INSIDE, but GPS geofence evaluated OUTSIDE (accuracy: " + request.getAccuracy() + "m)"
                    );
                }
            }
        });

        return LocationResponseDto.builder()
                .id(update.getId())
                .latitude(update.getLatitude())
                .longitude(update.getLongitude())
                .accuracy(update.getAccuracy())
                .geofenceStatus(geofenceStatus)
                .timestamp(update.getTimestamp())
                .build();
    }

    @Transactional(readOnly = true)
    public LocationResponseDto getLatestLocation(UUID userId) {
        return locationUpdateRepository.findLatestByUserId(userId)
                .map(loc -> LocationResponseDto.builder()
                        .id(loc.getId())
                        .latitude(loc.getLatitude())
                        .longitude(loc.getLongitude())
                        .accuracy(loc.getAccuracy())
                        .geofenceStatus(geofenceService.evaluateLocation(loc.getLatitude(), loc.getLongitude()))
                        .timestamp(loc.getTimestamp())
                        .build())
                .orElse(null);
    }
}
