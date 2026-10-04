package com.waypoint.backend.delivery;

public enum DeliveryStatus {
    PENDING, EN_ROUTE, ARRIVED, PARTIAL, FAILED, DELIVERED, RECEIPT_CONFIRMED;

    public boolean isOutcome() {
        return this == PARTIAL || this == FAILED || this == DELIVERED || this == RECEIPT_CONFIRMED;
    }
}
