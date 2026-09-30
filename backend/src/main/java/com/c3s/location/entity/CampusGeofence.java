package com.c3s.location.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "campus_geofences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampusGeofence {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "fence_type", nullable = false, length = 20)
    private String fenceType; // POLYGON, CIRCLE

    @Column(name = "center_lat")
    private Double centerLat;

    @Column(name = "center_lng")
    private Double centerLng;

    @Column(name = "radius_meters")
    private Double radiusMeters;

    @Column(name = "polygon_geojson", columnDefinition = "TEXT")
    private String polygonGeojson;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
