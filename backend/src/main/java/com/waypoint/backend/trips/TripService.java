package com.waypoint.backend.trips;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.history.EventHistoryService;
import com.waypoint.backend.notifications.NotificationService;
import com.waypoint.backend.reference.depot.Depot;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class TripService {

    static final String ENTITY_TYPE = "Trip";

    private static final Map<TripStatus, Set<TripStatus>> TRANSITIONS = new EnumMap<>(TripStatus.class);

    static {
        TRANSITIONS.put(TripStatus.DRAFT, EnumSet.of(TripStatus.PLANNED, TripStatus.CANCELLED));
        TRANSITIONS.put(TripStatus.PLANNED, EnumSet.of(TripStatus.LOADING, TripStatus.CANCELLED));
        TRANSITIONS.put(TripStatus.LOADING, EnumSet.of(TripStatus.READY));
        TRANSITIONS.put(TripStatus.READY, EnumSet.of(TripStatus.DISPATCHED));
        TRANSITIONS.put(TripStatus.DISPATCHED, EnumSet.of(TripStatus.IN_PROGRESS));
        TRANSITIONS.put(TripStatus.IN_PROGRESS, EnumSet.of(TripStatus.COMPLETED));
        TRANSITIONS.put(TripStatus.COMPLETED, EnumSet.noneOf(TripStatus.class));
        TRANSITIONS.put(TripStatus.CANCELLED, EnumSet.noneOf(TripStatus.class));
    }

    private final TripRepository tripRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final EventHistoryService historyService;

    public TripService(TripRepository tripRepository, NotificationService notificationService,
                       AuditService auditService, EventHistoryService historyService) {
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.historyService = historyService;
    }

    public List<Trip> list(CustomUserDetails actor, LocalDate date) {
        return tripRepository.findByDepotIdAndTripDate(actor.getUser().getDepotId(), date);
    }

    public Trip get(UUID id, CustomUserDetails actor) {
        Trip trip = load(id);
        requireDepot(actor, trip.getDepot());
        return trip;
    }

    @Transactional
    public Trip dispatch(UUID id, CustomUserDetails actor) {
        Trip trip = get(id, actor);
        move(trip, TripStatus.DISPATCHED, actor.getUser().getId());
        Trip saved = tripRepository.save(trip);

        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "TRIP_DISPATCHED",
                ENTITY_TYPE, saved.getId().toString(), "API", "SUCCESS", null);
        notificationService.notifyDepotRole(Role.DRIVER, saved.getDepot().getId(), "TRIP_DISPATCHED",
                ENTITY_TYPE, saved.getId().toString(),
                "Trip " + saved.getTripNumber() + " (" + saved.getVehicle().getVehicleCode() + ") is ready to leave.");
        return saved;
    }

    /** Applies a status change if the trip lifecycle allows it. The caller persists the trip. */
    public void move(Trip trip, TripStatus to, UUID userId) {
        TripStatus from = trip.getStatus();
        if (!TRANSITIONS.get(from).contains(to)) {
            throw ApiException.conflict("Trip " + trip.getId() + " cannot move from " + from + " to " + to);
        }
        trip.setStatus(to);
        historyService.record(ENTITY_TYPE, trip.getId(), "TRIP_" + to.name(), from.name(), to.name(), userId, null);
    }

    public Trip load(UUID id) {
        return tripRepository.findById(id).orElseThrow(() -> ApiException.notFound("Trip not found: " + id));
    }

    public void requireDepot(CustomUserDetails actor, Depot depot) {
        if (actor.getUser().getRole() != Role.ADMIN && !depot.getId().equals(actor.getUser().getDepotId())) {
            throw ApiException.forbidden("Trip does not belong to your depot");
        }
    }
}
