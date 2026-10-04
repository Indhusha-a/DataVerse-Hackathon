package com.waypoint.backend.reference.servicing;

import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.outlet.DockType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ServiceAllowanceRepository extends JpaRepository<ServiceAllowance, UUID> {
    Optional<ServiceAllowance> findByBrandAndDockType(Brand brand, DockType dockType);
}
