package com.c3s.movement.repository;

import com.c3s.movement.entity.UserCampusStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserCampusStatusRepository extends JpaRepository<UserCampusStatus, UUID> {
    @Query("SELECT COUNT(s) FROM UserCampusStatus s WHERE s.status = 'INSIDE'")
    long countInsideUsers();
}
