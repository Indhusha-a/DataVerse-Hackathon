package com.waypoint.backend.reference.outlet;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.depot.Depot;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

/**
 * One of the 120 store outlets. Maps 1:1 to a row in data/general_data/outlets.csv.
 * mallWindowStart/End are null for the ~100 outlets that aren't in a mall
 * (only mall_bay outlets have a fixed access window on top of their normal
 * delivery window).
 */
@Entity
@Table(name = "outlets")
@Getter
@Setter
@NoArgsConstructor
public class Outlet extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String outletCode; // "OUT001".."OUT120"

    @Enumerated(EnumType.STRING)
    private Brand brand;

    private String district;

    // EAGER, not LAZY: depot is read in OutletResponse.from(...) in the
    // controller layer, after the repository's transaction/session has
    // already closed (open-in-view is off). A lazy proxy can't resolve at
    // that point ("no session"). Only 2 depots exist, so eager-loading one
    // via an extra join is free — this isn't the N+1 risk eager fetch
    // usually is on a one-to-many or a large lookup table.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "depot_id")
    private Depot depot;

    @Enumerated(EnumType.STRING)
    private DockType dockType;

    @Enumerated(EnumType.STRING)
    private ParkingConstraint parkingConstraint;

    private LocalTime mallWindowStart;
    private LocalTime mallWindowEnd;

    private LocalTime windowOpenTime;
    private LocalTime windowCloseTime;
}
