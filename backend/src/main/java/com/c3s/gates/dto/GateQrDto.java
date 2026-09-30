package com.c3s.gates.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class GateQrDto {
    private UUID tokenId;
    private UUID gateId;
    private String gateCode;
    private String gateName;
    private String qrPayload; // Signed Base64 token
    private Integer version;
    private OffsetDateTime validFrom;
    private OffsetDateTime validUntil;
}
