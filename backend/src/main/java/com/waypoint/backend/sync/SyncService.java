package com.waypoint.backend.sync;

import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.common.ClockConfig;
import com.waypoint.backend.delivery.DeliveryService;
import com.waypoint.backend.notifications.NotificationService;
import com.waypoint.backend.security.CustomUserDetails;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Replays queued driver events through the same services as the online endpoints.
 * Deliberately not transactional as a whole: each event commits or rolls back on its own,
 * so one conflicting event cannot undo the events before it.
 */
@Service
public class SyncService {

    private static final Duration CLOCK_SKEW_ALLOWANCE = Duration.ofMinutes(1);

    private final SyncEventRepository syncEventRepository;
    private final DeliveryService deliveryService;
    private final NotificationService notificationService;
    private final Clock clock;

    public SyncService(SyncEventRepository syncEventRepository, DeliveryService deliveryService,
                       NotificationService notificationService, Clock clock) {
        this.syncEventRepository = syncEventRepository;
        this.deliveryService = deliveryService;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    public List<SyncResultResponse> submit(List<SyncEventRequest> events, CustomUserDetails actor) {
        List<SyncResultResponse> results = new ArrayList<>();
        for (SyncEventRequest request : events) {
            results.add(process(request, actor));
        }
        return results;
    }

    public SyncStatusResponse status(CustomUserDetails actor) {
        UUID userId = actor.getUser().getId();
        List<SyncResultResponse> recent = syncEventRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(e -> new SyncResultResponse(e.getClientEventId(), e.getStatus().name(), e.getMessage()))
                .toList();
        return new SyncStatusResponse(
                syncEventRepository.countByUserIdAndStatus(userId, SyncStatus.SYNCED),
                syncEventRepository.countByUserIdAndStatus(userId, SyncStatus.CONFLICT),
                recent);
    }

    private SyncResultResponse process(SyncEventRequest request, CustomUserDetails actor) {
        UUID userId = actor.getUser().getId();
        var existing = syncEventRepository.findByUserIdAndClientEventId(userId, request.eventId());
        if (existing.isPresent()) {
            return new SyncResultResponse(request.eventId(), existing.get().getStatus().name(),
                    "Already processed");
        }

        SyncEvent event = new SyncEvent();
        event.setUserId(userId);
        event.setClientEventId(request.eventId());
        event.setType(request.type());
        event.setStopId(request.stopId());
        event.setOutcome(request.outcome());
        event.setDeliveredUnits(request.deliveredUnits());
        event.setPodReference(request.podReference());
        event.setReason(request.reason());
        event.setNotes(request.notes());
        event.setClientTimestamp(request.clientTimestamp());

        try {
            if (request.clientTimestamp().isAfter(Instant.now(clock).plus(CLOCK_SKEW_ALLOWANCE))) {
                throw ApiException.badRequest("Event timestamp is in the future");
            }
            apply(request, actor);
            event.setStatus(SyncStatus.SYNCED);
            event.setMessage("Applied");
        } catch (ApiException e) {
            event.setStatus(SyncStatus.CONFLICT);
            event.setMessage(e.getMessage());
            notificationService.notifyUser(userId, "SYNC_CONFLICT", "SyncEvent", request.eventId(),
                    "Offline event " + request.eventId() + " could not be applied: " + e.getMessage());
        }
        syncEventRepository.save(event);
        return new SyncResultResponse(request.eventId(), event.getStatus().name(), event.getMessage());
    }

    private void apply(SyncEventRequest request, CustomUserDetails actor) {
        switch (request.type()) {
            case DRIVER_ARRIVED -> deliveryService.arrive(request.stopId(), actor);
            case DELIVERY_OUTCOME -> {
                if (request.outcome() == null || request.deliveredUnits() == null) {
                    throw ApiException.badRequest("DELIVERY_OUTCOME requires outcome and deliveredUnits");
                }
                deliveryService.record(request.stopId(), request.outcome(), request.deliveredUnits(),
                        request.podReference(), request.reason(), request.notes(), actor);
            }
        }
    }
}
