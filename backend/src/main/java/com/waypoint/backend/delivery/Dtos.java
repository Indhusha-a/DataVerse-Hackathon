package com.waypoint.backend.delivery;

import com.waypoint.backend.reference.outlet.ServiceWindow;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.UUID;

record DeliveryRequest(
        @NotNull UUID stopId,
        @NotNull DeliveryOutcome outcome,
        @NotNull Integer deliveredUnits,
        String podReference,
        String reason,
        String notes
) {}

record StopResponse(
        UUID stopId, int sequence, String orderCode, String outletCode, int orderUnits,
        LocalTime plannedArrivalTime, LocalTime windowClose, String deliveryStatus,
        String windowRisk, Integer deliveredUnits, String exceptionReason, String routeNote
) {
    static StopResponse from(Delivery d) {
        var outlet = d.getOrder().getOutlet();
        return new StopResponse(d.getStop().getId(), d.getStop().getSequence(), d.getOrder().getOrderCode(),
                outlet.getOutletCode(), d.getOrder().getOrderUnits(), d.getStop().getPlannedArrivalTime(),
                ServiceWindow.close(outlet), d.getStatus().name(),
                d.getWindowRisk().name(), d.getDeliveredUnits(), d.getExceptionReason(), d.getStop().getRouteNote());
    }
}

record DriverSummary(
        UUID tripId, String tripStatus, int totalStops, int completedStops, int pendingStops,
        double remainingDistanceKm, String nextOrderCode, String nextOutletCode, LocalTime nextArrival,
        LocalTime nextWindowClose
) {}
