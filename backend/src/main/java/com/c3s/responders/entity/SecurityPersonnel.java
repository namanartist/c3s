package com.c3s.responders.entity;

import com.c3s.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_personnel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityPersonnel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "employee_code", nullable = false, unique = true, length = 50)
    private String employeeCode;

    @Column(nullable = false, length = 100)
    private String designation;

    @Column(nullable = false, length = 30)
    private String status; // AVAILABLE, BUSY, EN_ROUTE, AT_INCIDENT, OFFLINE

    @Column(name = "current_location", length = 100)
    private String currentLocation;

    @Column(name = "last_seen")
    private OffsetDateTime lastSeen;
}
