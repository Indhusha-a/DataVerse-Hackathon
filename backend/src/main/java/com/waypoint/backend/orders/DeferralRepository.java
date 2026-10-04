package com.waypoint.backend.orders;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DeferralRepository extends JpaRepository<Deferral, UUID> {
    boolean existsByOrderId(UUID orderId);
    List<Deferral> findByOrderIdOrderByCreatedAtDesc(UUID orderId);
    List<Deferral> findByPlanId(UUID planId);
}
