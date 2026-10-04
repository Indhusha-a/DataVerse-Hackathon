package com.waypoint.backend.orders;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByOutletId(UUID outletId);
    List<Order> findByOutlet_Depot_Id(UUID depotId);
    List<Order> findByOutlet_Depot_IdAndStatusIn(UUID depotId, Collection<OrderStatus> statuses);
    long countByOrderCodeStartingWith(String prefix);
}
