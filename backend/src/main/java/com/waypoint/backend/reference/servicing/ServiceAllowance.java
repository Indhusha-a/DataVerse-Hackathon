package com.waypoint.backend.reference.servicing;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.outlet.DockType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Handling minutes per stop, keyed by brand and dock type. */
@Entity
@Table(name = "service_allowances")
@Getter
@Setter
@NoArgsConstructor
public class ServiceAllowance extends BaseEntity {

    @Enumerated(EnumType.STRING)
    private Brand brand;

    @Enumerated(EnumType.STRING)
    private DockType dockType;

    private double serviceAllowanceMin;
}
