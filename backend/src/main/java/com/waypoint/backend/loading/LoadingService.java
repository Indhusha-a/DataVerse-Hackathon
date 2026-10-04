package com.waypoint.backend.loading;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.history.EventHistoryService;
import com.waypoint.backend.notifications.NotificationService;
import com.waypoint.backend.orders.Order;
import com.waypoint.backend.orders.OrderService;
import com.waypoint.backend.orders.OrderStatus;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.Role;
import com.waypoint.backend.trips.Trip;
import com.waypoint.backend.trips.TripRepository;
import com.waypoint.backend.trips.TripService;
import com.waypoint.backend.trips.TripStatus;
import com.waypoint.backend.trips.TripStop;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class LoadingService {

    private final TripRepository tripRepository;
    private final TripService tripService;
    private final OrderService orderService;
    private final LoadingTaskRepository taskRepository;
    private final LoadingEventRepository eventRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final EventHistoryService historyService;
    private final Clock clock;

    public LoadingService(TripRepository tripRepository, TripService tripService, OrderService orderService,
                          LoadingTaskRepository taskRepository, LoadingEventRepository eventRepository,
                          NotificationService notificationService, AuditService auditService,
                          EventHistoryService historyService, Clock clock) {
        this.tripRepository = tripRepository;
        this.tripService = tripService;
        this.orderService = orderService;
        this.taskRepository = taskRepository;
        this.eventRepository = eventRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.historyService = historyService;
        this.clock = clock;
    }

    public List<Trip> tasks(CustomUserDetails actor, LocalDate date) {
        return tripRepository.findByDepotIdAndTripDate(actor.getUser().getDepotId(), date).stream()
                .filter(t -> t.getStatus() == TripStatus.PLANNED
                        || t.getStatus() == TripStatus.LOADING
                        || t.getStatus() == TripStatus.READY)
                .toList();
    }

    public List<LoadingEvent> events(UUID tripId, CustomUserDetails actor) {
        Trip trip = ownTrip(tripId, actor);
        return taskRepository.findByTripId(trip.getId())
                .map(task -> eventRepository.findByTaskIdOrderByCreatedAtAsc(task.getId()))
                .orElse(List.of());
    }

    @Transactional
    public Trip start(UUID tripId, CustomUserDetails actor) {
        Trip trip = ownTrip(tripId, actor);
        tripService.move(trip, TripStatus.LOADING, actor.getUser().getId());
        Trip saved = tripRepository.save(trip);

        LoadingTask task = taskRepository.findByTripId(saved.getId()).orElseGet(LoadingTask::new);
        task.setTrip(saved);
        task.setStatus(LoadingStatus.IN_PROGRESS);
        task.setLoaderUserId(actor.getUser().getId());
        task.setStartedAt(Instant.now(clock));
        taskRepository.save(task);
        addEvent(task, LoadingEventType.STARTED, null, null, actor);

        audit(actor, "LOADING_STARTED", saved);
        return saved;
    }

    @Transactional
    public Trip complete(UUID tripId, CustomUserDetails actor) {
        Trip trip = ownTrip(tripId, actor);
        tripService.move(trip, TripStatus.READY, actor.getUser().getId());
        for (TripStop stop : trip.getStops()) {
            orderService.move(stop.getOrder(), OrderStatus.LOADED, "ORDER_LOADED", actor.getUser().getId());
        }
        Trip saved = tripRepository.save(trip);

        LoadingTask task = taskRepository.findByTripId(saved.getId())
                .orElseThrow(() -> ApiException.conflict("Loading has not started for this trip"));
        task.setStatus(LoadingStatus.COMPLETE);
        task.setCompletedAt(Instant.now(clock));
        taskRepository.save(task);
        addEvent(task, LoadingEventType.COMPLETED, null, null, actor);

        audit(actor, "LOADING_COMPLETED", saved);
        return saved;
    }

    @Transactional
    public void reportIssue(UUID tripId, UUID orderId, LoadingEventType type, String description,
                            CustomUserDetails actor) {
        if (type == LoadingEventType.STARTED || type == LoadingEventType.COMPLETED) {
            throw ApiException.badRequest("Issue type must be SHORTFALL, DAMAGE or OTHER");
        }
        Trip trip = ownTrip(tripId, actor);
        LoadingTask task = taskRepository.findByTripId(trip.getId())
                .orElseThrow(() -> ApiException.conflict("Loading has not started for this trip"));
        Order order = null;
        if (orderId != null) {
            order = trip.getStops().stream()
                    .map(TripStop::getOrder)
                    .filter(o -> o.getId().equals(orderId))
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("Order " + orderId + " is not on this trip"));
        }

        addEvent(task, type, order == null ? null : order.getId(), description, actor);
        String eventType = type == LoadingEventType.SHORTFALL ? "LOADING_SHORTFALL" : "LOADING_ISSUE";
        String subject = order == null ? "Trip " + trip.getTripNumber() : order.getOrderCode();
        notificationService.notifyDepotRole(Role.DISPATCHER, trip.getDepot().getId(), eventType, "Trip",
                trip.getId().toString(), eventType.replace('_', ' ').toLowerCase() + " on " + subject + ": " + description);
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "LOADING_ISSUE_REPORTED",
                "Trip", trip.getId().toString(), "API", "SUCCESS", "type=" + type + ",description=" + description);
    }

    private void addEvent(LoadingTask task, LoadingEventType type, UUID orderId, String description,
                          CustomUserDetails actor) {
        LoadingEvent event = new LoadingEvent();
        event.setTask(task);
        event.setType(type);
        event.setOrderId(orderId);
        event.setDescription(description);
        event.setUserId(actor.getUser().getId());
        eventRepository.save(event);
        historyService.record("LoadingTask", task.getId(), "LOADING_" + type.name(), null, type.name(),
                actor.getUser().getId(), description);
    }

    private Trip ownTrip(UUID tripId, CustomUserDetails actor) {
        Trip trip = tripService.load(tripId);
        tripService.requireDepot(actor, trip.getDepot());
        return trip;
    }

    private void audit(CustomUserDetails actor, String action, Trip trip) {
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), action,
                "Trip", trip.getId().toString(), "API", "SUCCESS", null);
    }
}
