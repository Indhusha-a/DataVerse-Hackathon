package com.waypoint.backend.trips;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.planning.Plan;
import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.depot.Depot;
import com.waypoint.backend.reference.vehicle.Vehicle;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * One vehicle run for one day: a single brand and district. Depot, vehicle and
 * stops are EAGER because the response is built after the loading transaction.
 */
@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
public class Trip extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "depot_id", nullable = false)
    private Depot depot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    private LocalDate tripDate;
    private int tripNumber;

    @Enumerated(EnumType.STRING)
    private TripStatus status;

    @Enumerated(EnumType.STRING)
    private Brand brand;

    private String district;

    private double totalWeightKg;
    private double totalVolumeM3;
    private double totalDistanceKm;
    private double fuelLitres;
    private double plannedDurationMin;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("sequence ASC")
    private List<TripStop> stops = new ArrayList<>();
}
