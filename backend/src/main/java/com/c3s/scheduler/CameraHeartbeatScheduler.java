package com.c3s.scheduler;

import com.c3s.cameras.entity.Camera;
import com.c3s.cameras.repository.CameraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CameraHeartbeatScheduler {
    private final CameraRepository cameraRepository;

    // Periodic check every 5 minutes for stale camera streams
    @Scheduled(fixedRate = 300000)
    public void checkCameraHeartbeats() {
        OffsetDateTime threshold = OffsetDateTime.now(ZoneId.of("Asia/Kolkata")).minusMinutes(10);
        List<Camera> cameras = cameraRepository.findAll();

        for (Camera cam : cameras) {
            if ("ONLINE".equals(cam.getStatus()) && (cam.getLastHeartbeat() == null || cam.getLastHeartbeat().isBefore(threshold))) {
                cam.setStatus("DEGRADED");
                cameraRepository.save(cam);
                log.warn("Camera {} heartbeat missed. Marked as DEGRADED.", cam.getCameraCode());
            }
        }
    }
}
