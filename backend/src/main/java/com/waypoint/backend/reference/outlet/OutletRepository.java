package com.waypoint.backend.reference.outlet;

import com.waypoint.backend.reference.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OutletRepository extends JpaRepository<Outlet, UUID> {
    Optional<Outlet> findByOutletCode(String outletCode);
    List<Outlet> findByDepotId(UUID depotId);
    List<Outlet> findByBrand(Brand brand);
}
