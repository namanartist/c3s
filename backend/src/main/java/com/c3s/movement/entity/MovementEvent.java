package com.c3s.movement.entity;

import com.c3s.auth.entity.User;
import com.c3s.gates.entity.Gate;
import com.c3s.gates.entity.GateQrToken;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "movement_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovementEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false)
    private Gate gate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_token_id")
    private GateQrToken qrToken;

    @Column(name = "movement_type", nullable = false, length = 20)
    private String movementType; // CHECK_IN, CHECK_OUT

    @Column(nullable = false)
    private OffsetDateTime timestamp;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "verification_status", nullable = false, length = 20)
    private String verificationStatus; // VERIFIED, REJECTED, OVERRIDDEN

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
