package com.c3s.evidence.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class EvidenceDto {
    private UUID id;
    private UUID incidentId;
    private UUID uploadedById;
    private String uploadedByName;
    private String filename;
    private String contentType;
    private String storageReference;
    private String sha256Hash;
    private Long fileSize;
    private OffsetDateTime createdAt;
}
