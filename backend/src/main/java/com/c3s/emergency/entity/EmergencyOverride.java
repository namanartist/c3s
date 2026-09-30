package com.c3s.emergency.entity;

import com.c3s.auth.entity.User;
import com.c3s.gates.entity.Gate;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "emergency_overrides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyOverride {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by", nullable = false)
    private User initiatedBy;

    @Column(name = "override_type", nullable = false, length = 50)
    private String overrideType; // CAMPUS_LOCKDOWN, EVACUATION, EMERGENCY_EXIT, GATE_CLOSURE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    private Gate gate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(nullable = false, length = 20)
    private String status; // ACTIVE, REVOKED, EXPIRED

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
