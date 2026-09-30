package com.c3s.gates.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "gate_qr_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GateQrToken {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion;

    @Column(name = "valid_from", nullable = false)
    private OffsetDateTime validFrom;

    @Column(name = "valid_until", nullable = false)
    private OffsetDateTime validUntil;

    @Column(nullable = false, length = 20)
    private String status; // ACTIVE, ROTATED, EXPIRED, REVOKED

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
