package com.c3s.gates.service;

import com.c3s.common.exception.InvalidQrException;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.common.util.QrCryptoUtils;
import com.c3s.gates.dto.GateQrDto;
import com.c3s.gates.entity.Gate;
import com.c3s.gates.entity.GateQrToken;
import com.c3s.gates.repository.GateQrTokenRepository;
import com.c3s.gates.repository.GateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class QrService {
    private final GateQrTokenRepository qrTokenRepository;
    private final GateRepository gateRepository;

    @Value("${c3s.qr.signing-secret:C3S_CAMPUS_SECURE_QR_HMAC_SECRET_2026_MITS_GWALIOR_KEY}")
    private String qrSigningSecret;

    @Transactional
    public GateQrDto getOrGenerateDailyQr(UUID gateId) {
        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new ResourceNotFoundException("Gate not found: " + gateId));

        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        OffsetDateTime now = OffsetDateTime.now(istZone);

        return qrTokenRepository.findActiveTokenForGate(gateId, now)
                .map(token -> mapToDto(token, gate))
                .orElseGet(() -> rotateQr(gateId));
    }

    @Transactional
    public GateQrDto rotateQr(UUID gateId) {
        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new ResourceNotFoundException("Gate not found: " + gateId));

        qrTokenRepository.rotateActiveTokensForGate(gateId);

        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        OffsetDateTime now = OffsetDateTime.now(istZone);
        // Start of today to end of today in IST
        OffsetDateTime startOfDay = now.toLocalDate().atStartOfDay(istZone).toOffsetDateTime();
        OffsetDateTime endOfDay = now.toLocalDate().plusDays(1).atStartOfDay(istZone).toOffsetDateTime().minusSeconds(1);

        int version = (int) (System.currentTimeMillis() / 1000);
        String rawOpaqueToken = "C3S:" + gate.getGateCode() + ":" + gate.getId() + ":" + System.currentTimeMillis() + ":" + UUID.randomUUID();
        String signedPayload = QrCryptoUtils.createSignedQrPayload(rawOpaqueToken, qrSigningSecret);
        String tokenHash = QrCryptoUtils.sha256(signedPayload);

        GateQrToken newToken = GateQrToken.builder()
                .gate(gate)
                .tokenHash(tokenHash)
                .tokenVersion(version)
                .validFrom(startOfDay)
                .validUntil(endOfDay)
                .status("ACTIVE")
                .createdAt(now)
                .build();

        qrTokenRepository.save(newToken);
        log.info("Generated new daily QR for gate {}: version {}", gate.getGateCode(), version);

        return GateQrDto.builder()
                .tokenId(newToken.getId())
                .gateId(gate.getId())
                .gateCode(gate.getGateCode())
                .gateName(gate.getName())
                .qrPayload(signedPayload)
                .version(version)
                .validFrom(startOfDay)
                .validUntil(endOfDay)
                .build();
    }

    @Transactional(readOnly = true)
    public GateQrToken validateQr(String qrPayload) {
        if (qrPayload == null || qrPayload.isBlank()) {
            throw new InvalidQrException("QR token payload cannot be empty");
        }

        if (!QrCryptoUtils.verifySignedQrPayload(qrPayload, qrSigningSecret)) {
            throw new InvalidQrException("QR signature verification failed. Untrusted or modified QR.");
        }

        String tokenHash = QrCryptoUtils.sha256(qrPayload);
        GateQrToken token = qrTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidQrException("QR token does not exist in registry"));

        if (!"ACTIVE".equalsIgnoreCase(token.getStatus())) {
            throw new InvalidQrException("QR token is no longer active (status: " + token.getStatus() + ")");
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));
        if (now.isBefore(token.getValidFrom()) || now.isAfter(token.getValidUntil())) {
            throw new InvalidQrException("QR token validity period has expired or is outside window");
        }

        if (!"ACTIVE".equalsIgnoreCase(token.getGate().getStatus())) {
            throw new InvalidQrException("Gate " + token.getGate().getName() + " is currently inactive or under maintenance");
        }

        return token;
    }

    private GateQrDto mapToDto(GateQrToken token, Gate gate) {
        // Reconstruct signed payload using gate code and token metadata
        String rawOpaqueToken = "C3S:" + gate.getGateCode() + ":" + gate.getId() + ":" + token.getTokenVersion() + ":" + token.getId();
        String signedPayload = QrCryptoUtils.createSignedQrPayload(rawOpaqueToken, qrSigningSecret);

        return GateQrDto.builder()
                .tokenId(token.getId())
                .gateId(gate.getId())
                .gateCode(gate.getGateCode())
                .gateName(gate.getName())
                .qrPayload(signedPayload)
                .version(token.getTokenVersion())
                .validFrom(token.getValidFrom())
                .validUntil(token.getValidUntil())
                .build();
    }
}
