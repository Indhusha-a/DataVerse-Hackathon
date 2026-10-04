package com.waypoint.backend.receipts;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

record ReceiveRequest(
        @NotNull Integer receivedUnits,
        String notes
) {}

record StoreOrderResponse(
        UUID id, String orderCode, String status, int orderUnits,
        String deliveryStatus, Integer deliveredUnits, Integer receivedUnits,
        boolean discrepancy, String deferralReason, LocalTime expectedArrival
) {}

record StoreSummary(
        int ordersToday, int inTransit, int delivered, int lateRiskOrders,
        List<StoreOrderResponse> recentOrders, List<Eta> inTransitEtas
) {
    record Eta(String orderCode, LocalTime eta) {}
}
