package com.waypoint.backend.loading;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LoadingTaskRepository extends JpaRepository<LoadingTask, UUID> {
    Optional<LoadingTask> findByTripId(UUID tripId);
}
