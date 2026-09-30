package com.c3s.scheduler;

import com.c3s.gates.entity.Gate;
import com.c3s.gates.repository.GateRepository;
import com.c3s.gates.service.QrService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyQrRotationScheduler {
    private final GateRepository gateRepository;
    private final QrService qrService;

    // Daily midnight rotation in Asia/Kolkata timezone
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
    public void executeDailyQrRollover() {
        log.info("Executing scheduled midnight daily QR code rotation for all gates in Asia/Kolkata...");
        List<Gate> gates = gateRepository.findAll();
        for (Gate gate : gates) {
            try {
                qrService.rotateQr(gate.getId());
                log.info("Daily QR rotated successfully for gate: {}", gate.getGateCode());
            } catch (Exception e) {
                log.error("Failed to rotate daily QR for gate: {}", gate.getGateCode(), e);
            }
        }
    }
}
