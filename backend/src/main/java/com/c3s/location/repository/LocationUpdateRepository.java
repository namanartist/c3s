package com.c3s.location.repository;

import com.c3s.location.entity.LocationUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LocationUpdateRepository extends JpaRepository<LocationUpdate, UUID> {
    @Query("SELECT l FROM LocationUpdate l WHERE l.user.id = :userId ORDER BY l.timestamp DESC LIMIT 1")
    Optional<LocationUpdate> findLatestByUserId(@Param("userId") UUID userId);

    long deleteByTimestampBefore(OffsetDateTime cutoff);
}
