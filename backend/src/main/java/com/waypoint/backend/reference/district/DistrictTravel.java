package com.waypoint.backend.reference.district;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.reference.depot.Depot;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per district (12 total), from data/general_data/district_travel.csv.
 * This is the real travel-time reference the Planning engine uses to compute
 * trip duration — never a hardcoded estimate. depot is EAGER: read by the
 * allocation engine right after a repository lookup, same reasoning as every
 * other small reference table in this project.
 */
@Entity
@Table(name = "district_travels")
@Getter
@Setter
@NoArgsConstructor
public class DistrictTravel extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String district;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "depot_id")
    private Depot depot;

    @Enumerated(EnumType.STRING)
    private RoadClass roadClass;

    private double freeFlowKmh;
    private double depotToDistrictKm;
    private double depotToDistrictFreeflowMin;
    private double interStopKm;
    private double interStopFreeflowMin;
}