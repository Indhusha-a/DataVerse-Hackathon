package com.waypoint.backend.sync;

import com.waypoint.backend.delivery.DeliveryOutcome;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

record SyncEventRequest(
        @NotBlank String eventId,
        @NotNull SyncEventType type,
        @NotNull UUID stopId,
        DeliveryOutcome outcome,
        Integer deliveredUnits,
        String podReference,
        String reason,
        String notes,
        @NotNull Instant clientTimestamp
) {}

record SyncBatchRequest(
        @NotEmpty @Valid List<SyncEventRequest> events
) {}

record SyncResultResponse(String eventId, String status, String message) {}

record SyncStatusResponse(long synced, long conflicts, List<SyncResultResponse> recent) {}
