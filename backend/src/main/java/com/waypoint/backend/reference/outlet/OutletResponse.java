package com.waypoint.backend.reference.outlet;

import java.time.LocalTime;
import java.util.UUID;

public record OutletResponse(
        UUID id, String outletCode, String brand, String district, String depotCode,
        String dockType, String parkingConstraint,
        LocalTime mallWindowStart, LocalTime mallWindowEnd,
        LocalTime windowOpenTime, LocalTime windowCloseTime
) {
    public static OutletResponse from(Outlet o) {
        return new OutletResponse(o.getId(), o.getOutletCode(), o.getBrand().name(), o.getDistrict(),
                o.getDepot() != null ? o.getDepot().getCode() : null,
                o.getDockType().name(), o.getParkingConstraint().name(),
                o.getMallWindowStart(), o.getMallWindowEnd(), o.getWindowOpenTime(), o.getWindowCloseTime());
    }
}
