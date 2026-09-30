package com.c3s.evidence.service;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.common.util.QrCryptoUtils;
import com.c3s.evidence.dto.EvidenceDto;
import com.c3s.evidence.entity.Evidence;
import com.c3s.evidence.repository.EvidenceRepository;
import com.c3s.incidents.entity.Incident;
import com.c3s.incidents.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class EvidenceStorageService {
    private final EvidenceRepository evidenceRepository;
    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public EvidenceDto storeEvidence(UUID incidentId, UUID uploaderId, MultipartFile file) throws IOException {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));

        User uploader = userRepository.findById(uploaderId)
                .orElseThrow(() -> new ResourceNotFoundException("Uploader user not found: " + uploaderId));

        byte[] bytes = file.getBytes();
        String sha256 = QrCryptoUtils.sha256(new String(bytes));
        String storageRef = "s3://c3s-evidence-vault/" + incident.getIncidentNumber() + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

        Evidence evidence = Evidence.builder()
                .incident(incident)
                .uploadedBy(uploader)
                .filename(file.getOriginalFilename())
                .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .storageReference(storageRef)
                .sha256Hash(sha256)
                .fileSize(file.getSize())
                .createdAt(now)
                .build();

        evidenceRepository.save(evidence);

        auditService.log(uploaderId, "USER", "EVIDENCE_ACCESS", "Evidence", evidence.getId().toString(), "internal", "web", "SUCCESS", "Uploaded evidence " + file.getOriginalFilename());

        return toDto(evidence);
    }

    @Transactional(readOnly = true)
    public List<EvidenceDto> getEvidenceForIncident(UUID incidentId) {
        return evidenceRepository.findByIncidentId(incidentId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public EvidenceDto toDto(Evidence e) {
        return EvidenceDto.builder()
                .id(e.getId())
                .incidentId(e.getIncident().getId())
                .uploadedById(e.getUploadedBy().getId())
                .uploadedByName(e.getUploadedBy().getFullName())
                .filename(e.getFilename())
                .contentType(e.getContentType())
                .storageReference(e.getStorageReference())
                .sha256Hash(e.getSha256Hash())
                .fileSize(e.getFileSize())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
