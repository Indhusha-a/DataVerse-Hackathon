package com.waypoint.backend.trips;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface TripStopRepository extends JpaRepository<TripStop, UUID> {
    Optional<TripStop> findByOrder_Id(UUID orderId);

    @Query("""
            select max(s.trip.tripDate) from TripStop s
            where s.order.outlet.id = :outletId
              and s.trip.status = :status
              and s.trip.tripDate < :before
            """)
    LocalDate findLastServedDate(@Param("outletId") UUID outletId, @Param("status") TripStatus status,
                                 @Param("before") LocalDate before);
}
