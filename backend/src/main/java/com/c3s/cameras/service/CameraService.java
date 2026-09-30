package com.c3s.cameras.service;

import com.c3s.cameras.dto.CameraDto;
import com.c3s.cameras.dto.CameraEventDto;
import com.c3s.cameras.entity.Camera;
import com.c3s.cameras.repository.CameraEventRepository;
import com.c3s.cameras.repository.CameraRepository;
import com.c3s.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CameraService {
    private final CameraRepository cameraRepository;
    private final CameraEventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<CameraDto> getAllCameras() {
        return cameraRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CameraDto getCameraById(UUID id) {
        return cameraRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Camera not found: " + id));
    }

    @Transactional
    public CameraDto updateCameraStatus(UUID id, String status) {
        Camera cam = cameraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Camera not found: " + id));
        cam.setStatus(status);
        cam.setLastHeartbeat(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));
        return toDto(cameraRepository.save(cam));
    }

    @Transactional(readOnly = true)
    public List<CameraEventDto> getCameraEvents(UUID cameraId) {
        return eventRepository.findByCameraIdOrderByTimestampDesc(cameraId).stream()
                .map(e -> CameraEventDto.builder()
                        .id(e.getId())
                        .cameraId(e.getCamera().getId())
                        .eventType(e.getEventType())
                        .timestamp(e.getTimestamp())
                        .snapshotUrl(e.getSnapshotUrl())
                        .metadata(e.getMetadata())
                        .build())
                .collect(Collectors.toList());
    }

    public CameraDto toDto(Camera c) {
        return CameraDto.builder()
                .id(c.getId())
                .cameraCode(c.getCameraCode())
                .name(c.getName())
                .gateCode(c.getGate() != null ? c.getGate().getGateCode() : null)
                .building(c.getBuilding())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .status(c.getStatus())
                .streamReference(c.getStreamReference())
                .lastHeartbeat(c.getLastHeartbeat())
                .build();
    }
}
