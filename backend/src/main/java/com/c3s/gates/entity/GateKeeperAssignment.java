package com.c3s.gates.entity;

import com.c3s.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "gate_keeper_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GateKeeperAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "assigned_from", nullable = false)
    private OffsetDateTime assignedFrom;

    @Column(name = "assigned_until")
    private OffsetDateTime assignedUntil;

    @Column(nullable = false, length = 20)
    private String status; // ACTIVE, EXPIRED, REVOKED

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
