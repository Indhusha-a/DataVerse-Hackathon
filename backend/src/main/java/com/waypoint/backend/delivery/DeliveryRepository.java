package com.waypoint.backend.delivery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {
    List<Delivery> findByTripId(UUID tripId);
    Optional<Delivery> findByStopId(UUID stopId);
    Optional<Delivery> findByOrderId(UUID orderId);
}
