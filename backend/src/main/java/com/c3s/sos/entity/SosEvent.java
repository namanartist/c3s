package com.c3s.sos.entity;

import com.c3s.auth.entity.User;
import com.c3s.incidents.entity.Incident;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sos_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SosEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "triggered_at", nullable = false)
    private OffsetDateTime triggeredAt;

    private Double latitude;
    private Double longitude;
    private Double accuracy;

    @Column(nullable = false, length = 30)
    private String status; // TRIGGERED, ACKNOWLEDGED, RESPONDER_ASSIGNED, EN_ROUTE, ARRIVED, RESOLVED, CANCELLED

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}
