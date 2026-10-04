package com.waypoint.backend.planning;

import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.district.DistrictTravel;
import com.waypoint.backend.reference.outlet.Outlet;
import com.waypoint.backend.reference.servicing.ServiceAllowance;
import com.waypoint.backend.reference.servicing.ServiceAllowanceRepository;
import com.waypoint.backend.reference.vehicle.Vehicle;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Trip time, distance and fuel rules. Time is computed as:
 * outbound + inter-stop travel + per-stop handling. Distance is the round trip
 * from the depot, so fuel covers the return leg the time formula leaves out.
 */
@Component
class TripCalculator {

    static final double FRESH_DAILY_BUDGET_MIN = 270.0;
    static final double STYLE_TECH_DAILY_BUDGET_MIN = 480.0;

    private final ServiceAllowanceRepository serviceAllowances;

    TripCalculator(ServiceAllowanceRepository serviceAllowances) {
        this.serviceAllowances = serviceAllowances;
    }

    double durationMinutes(DistrictTravel travel, List<Outlet> stops, Brand brand) {
        if (stops.isEmpty()) return 0;
        double minutes = travel.getDepotToDistrictFreeflowMin()
                + travel.getInterStopFreeflowMin() * (stops.size() - 1);
        for (Outlet outlet : stops) {
            minutes += serviceMinutes(brand, outlet);
        }
        return minutes;
    }

    /** Route distance as recorded in the dataset's route legs: outbound plus inter-stop legs, no return leg. */
    double routeKm(DistrictTravel travel, int stopCount) {
        if (stopCount == 0) return 0;
        return travel.getDepotToDistrictKm() + travel.getInterStopKm() * (stopCount - 1);
    }

    double fuelLitres(double distanceKm, Vehicle vehicle) {
        return distanceKm / vehicle.getKmPerL();
    }

    static double dailyBudgetMinutes(Brand brand) {
        return brand == Brand.FRESH ? FRESH_DAILY_BUDGET_MIN : STYLE_TECH_DAILY_BUDGET_MIN;
    }

    double serviceMinutes(Brand brand, Outlet outlet) {
        ServiceAllowance allowance = serviceAllowances.findByBrandAndDockType(brand, outlet.getDockType())
                .orElseThrow(() -> new IllegalStateException(
                        "No service allowance for " + brand + "/" + outlet.getDockType()));
        return allowance.getServiceAllowanceMin();
    }
}
