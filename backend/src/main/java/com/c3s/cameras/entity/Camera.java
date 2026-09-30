package com.c3s.cameras.entity;

import com.c3s.gates.entity.Gate;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cameras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Camera {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "camera_code", nullable = false, unique = true, length = 50)
    private String cameraCode;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    private Gate gate;

    @Column(length = 100)
    private String building;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false, length = 20)
    private String status; // ONLINE, OFFLINE, DEGRADED, MAINTENANCE, UNKNOWN

    @Column(name = "stream_reference", length = 255)
    private String streamReference;

    @Column(name = "last_heartbeat")
    private OffsetDateTime lastHeartbeat;
}
