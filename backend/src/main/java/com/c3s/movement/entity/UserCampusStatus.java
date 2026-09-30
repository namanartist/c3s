package com.c3s.movement.entity;

import com.c3s.auth.entity.User;
import com.c3s.gates.entity.Gate;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_campus_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCampusStatus {
    @Id
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 20)
    private String status; // INSIDE, OUTSIDE, UNKNOWN

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_gate_id")
    private Gate lastGate;

    @Column(name = "last_movement_id")
    private UUID lastMovementId;

    @Column(name = "last_changed_at", nullable = false)
    private OffsetDateTime lastChangedAt;
}
