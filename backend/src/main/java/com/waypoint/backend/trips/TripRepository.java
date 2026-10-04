package com.waypoint.backend.trips;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByDepotIdAndTripDate(UUID depotId, LocalDate tripDate);
    List<Trip> findByVehicleIdAndTripDateBetween(UUID vehicleId, LocalDate from, LocalDate to);
    List<Trip> findByPlanId(UUID planId);
    boolean existsByVehicleId(UUID vehicleId);
}
