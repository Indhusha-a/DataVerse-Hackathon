package com.waypoint.backend.trips;

import com.waypoint.backend.orders.Order;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "trip_stops")
@Getter
@Setter
@NoArgsConstructor
public class TripStop {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private int sequence;

    /** Service start time, after any wait for the delivery window to open. */
    private LocalTime plannedArrivalTime;

    private double distanceFromPreviousKm;

    /** Why this stop was added to an existing route, when it was a smart en-route insertion. */
    @Column(length = 300)
    private String routeNote;
}
