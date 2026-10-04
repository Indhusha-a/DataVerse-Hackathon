package com.waypoint.backend.reference.depot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DepotRepository extends JpaRepository<Depot, UUID> {
    Optional<Depot> findByCode(String code);
}
