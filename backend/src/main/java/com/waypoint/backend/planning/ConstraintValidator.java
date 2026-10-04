package com.waypoint.backend.planning;

import com.waypoint.backend.orders.Order;
import com.waypoint.backend.orders.TempRequirement;
import com.waypoint.backend.reference.outlet.ParkingConstraint;
import com.waypoint.backend.reference.vehicle.TempCapability;
import com.waypoint.backend.reference.vehicle.Vehicle;
import com.waypoint.backend.reference.vehicle.VehicleType;

/** Single-pairing legality checks. Window, time and fuel checks live in the engine. */
final class ConstraintValidator {

    private ConstraintValidator() {}

    static boolean depotMatches(Order order, Vehicle vehicle) {
        return order.getOutlet().getDepot().getId().equals(vehicle.getDepot().getId());
    }

    static boolean tempCompatible(Order order, Vehicle vehicle) {
        return order.getTempRequirement() != TempRequirement.CHILLED || vehicle.getTemp() == TempCapability.REEFER;
    }

    static boolean vanOnlyCompatible(Order order, Vehicle vehicle) {
        return order.getOutlet().getParkingConstraint() != ParkingConstraint.VAN_ONLY
                || vehicle.getType() == VehicleType.VAN;
    }

    static boolean fitsCapacity(double weightKg, double volumeM3, Vehicle vehicle) {
        return weightKg <= vehicle.getWeightCapKg() && volumeM3 <= vehicle.getVolumeCapM3();
    }
}
