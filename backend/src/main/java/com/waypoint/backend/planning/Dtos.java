package com.waypoint.backend.planning;

import com.waypoint.backend.reference.vehicle.TempCapability;
import com.waypoint.backend.reference.vehicle.VehicleType;
import com.waypoint.backend.trips.TripResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

record PlanView(
        UUID id, LocalDate planDate, String status, List<TripResponse> trips, List<DeferredOrder> deferred
) {
    record DeferredOrder(String orderCode, String outletCode, List<String> reasons) {}
}

record VehicleAvailability(
        UUID id, String vehicleCode, VehicleType type, TempCapability temp, int tripsToday, int maxTripsPerDay
) {}
