package com.waypoint.backend.delivery;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.orders.Order;
import com.waypoint.backend.trips.Trip;
import com.waypoint.backend.trips.TripStop;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** The delivery attempt for one order at one stop. */
@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
public class Delivery extends BaseEntity {

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "stop_id", nullable = false, unique = true)
    private TripStop stop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;

    @Enumerated(EnumType.STRING)
    private WindowRisk windowRisk = WindowRisk.NONE;

    private Instant arrivedAt;
    private Integer deliveredUnits;
    private String podReference;
    private String exceptionReason;
    private String notes;
}
