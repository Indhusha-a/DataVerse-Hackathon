package com.waypoint.backend.reference.vehicle;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.reference.depot.Depot;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One of the 60 fleet vehicles. Maps 1:1 to a row in data/general_data/vehicles.csv.
 * Capacities are taken verbatim from the dataset — never invented generic
 * classes like "a truck holds 5000kg".
 */
@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String vehicleCode; // "VEH001".."VEH060"

    @Enumerated(EnumType.STRING)
    private VehicleType type;

    @Enumerated(EnumType.STRING)
    private TempCapability temp;

    private double weightCapKg;
    private double volumeCapM3;
    private String fuelType;
    private double kmPerL;
    private double weeklyFuelQuotaL;

    // EAGER, not LAZY — same reasoning as Outlet.depot: VehicleResponse.from(...)
    // reads depot in the controller layer, after the session that fetched
    // the Vehicle has already closed (open-in-view is off).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "depot_id")
    private Depot depot;
}
