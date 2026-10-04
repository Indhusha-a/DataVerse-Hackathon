package com.waypoint.backend.trips;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/** Shared by planning, loading, delivery and the dispatcher views. */
public record TripResponse(
        UUID id, String depotCode, String vehicleCode, LocalDate tripDate, int tripNumber,
        String status, String brand, String district,
        double totalWeightKg, double totalVolumeM3, double totalDistanceKm, double fuelLitres,
        double plannedDurationMin, List<StopResponse> stops
) {
    public static TripResponse from(Trip t) {
        return new TripResponse(t.getId(), t.getDepot().getCode(), t.getVehicle().getVehicleCode(),
                t.getTripDate(), t.getTripNumber(), t.getStatus().name(), t.getBrand().name(), t.getDistrict(),
                t.getTotalWeightKg(), t.getTotalVolumeM3(), t.getTotalDistanceKm(), t.getFuelLitres(),
                t.getPlannedDurationMin(), t.getStops().stream().map(StopResponse::from).toList());
    }

    public record StopResponse(
            UUID stopId, UUID orderId, int sequence, String orderCode, String outletCode, String orderStatus,
            LocalTime plannedArrivalTime, double distanceFromPreviousKm
    ) {
        public static StopResponse from(TripStop s) {
            return new StopResponse(s.getId(), s.getOrder().getId(), s.getSequence(), s.getOrder().getOrderCode(),
                    s.getOrder().getOutlet().getOutletCode(), s.getOrder().getStatus().name(),
                    s.getPlannedArrivalTime(), s.getDistanceFromPreviousKm());
        }
    }
}
