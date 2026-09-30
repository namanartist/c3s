package com.c3s.incidents.entity;

import com.c3s.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "incident_number", nullable = false, unique = true, length = 50)
    private String incidentNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, length = 20)
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false, length = 30)
    private String status; // OPEN, ACKNOWLEDGED, ASSIGNED, EN_ROUTE, ARRIVED, INVESTIGATING, RESOLVED, CLOSED, CANCELLED

    private Double latitude;
    private Double longitude;

    @Column(name = "location_description", length = 255)
    private String locationDescription;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}
