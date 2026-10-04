package com.waypoint.backend.reference.vehicle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Used by the Admin module to create or update a vehicle at runtime. */
public record VehicleUpsertRequest(
        @NotBlank String vehicleCode,
        @NotNull VehicleType type,
        @NotNull TempCapability temp,
        @Positive double weightCapKg,
        @Positive double volumeCapM3,
        @NotBlank String fuelType,
        @Positive double kmPerL,
        @Positive double weeklyFuelQuotaL,
        @NotBlank String depotCode
) {
}
