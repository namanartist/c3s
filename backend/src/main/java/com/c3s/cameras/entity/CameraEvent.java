package com.c3s.cameras.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "camera_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CameraEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camera_id", nullable = false)
    private Camera camera;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(nullable = false)
    private OffsetDateTime timestamp;

    @Column(name = "snapshot_url", length = 255)
    private String snapshotUrl;

    @Column(columnDefinition = "TEXT")
    private String metadata;
}
