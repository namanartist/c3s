package com.c3s.gates.repository;

import com.c3s.gates.entity.GateQrToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GateQrTokenRepository extends JpaRepository<GateQrToken, UUID> {
    Optional<GateQrToken> findByTokenHash(String tokenHash);

    @Query("SELECT t FROM GateQrToken t WHERE t.gate.id = :gateId AND t.status = 'ACTIVE' AND t.validFrom <= :now AND t.validUntil >= :now ORDER BY t.createdAt DESC LIMIT 1")
    Optional<GateQrToken> findActiveTokenForGate(@Param("gateId") UUID gateId, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("UPDATE GateQrToken t SET t.status = 'ROTATED' WHERE t.gate.id = :gateId AND t.status = 'ACTIVE'")
    void rotateActiveTokensForGate(@Param("gateId") UUID gateId);
}
