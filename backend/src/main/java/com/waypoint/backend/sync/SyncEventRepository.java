package com.waypoint.backend.sync;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SyncEventRepository extends JpaRepository<SyncEvent, UUID> {
    Optional<SyncEvent> findByUserIdAndClientEventId(UUID userId, String clientEventId);
    List<SyncEvent> findTop20ByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndStatus(UUID userId, SyncStatus status);
}
