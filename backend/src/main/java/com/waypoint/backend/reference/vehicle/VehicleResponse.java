package com.waypoint.backend.reference.vehicle;

import java.util.UUID;

public record VehicleResponse(
        UUID id, String vehicleCode, String type, String temp,
        double weightCapKg, double volumeCapM3, String fuelType, double kmPerL,
        double weeklyFuelQuotaL, String depotCode
) {
    public static VehicleResponse from(Vehicle v) {
        return new VehicleResponse(v.getId(), v.getVehicleCode(), v.getType().name(), v.getTemp().name(),
                v.getWeightCapKg(), v.getVolumeCapM3(), v.getFuelType(), v.getKmPerL(),
                v.getWeeklyFuelQuotaL(), v.getDepot() != null ? v.getDepot().getCode() : null);
    }
}
