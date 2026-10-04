package com.waypoint.backend.delivery;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.common.ClockConfig;
import com.waypoint.backend.notifications.NotificationService;
import com.waypoint.backend.orders.Order;
import com.waypoint.backend.orders.OrderService;
import com.waypoint.backend.orders.OrderStatus;
import com.waypoint.backend.reference.outlet.ServiceWindow;
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
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final TripRepository tripRepository;
    private final TripService tripService;
    private final OrderService orderService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final Clock clock;

    public DeliveryService(DeliveryRepository deliveryRepository, TripRepository tripRepository,
                           TripService tripService, OrderService orderService, AuditService auditService,
                           NotificationService notificationService, Clock clock) {
        this.deliveryRepository = deliveryRepository;
        this.tripRepository = tripRepository;
        this.tripService = tripService;
        this.orderService = orderService;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    /** Creates one PENDING delivery per stop when a trip is approved. */
    @Transactional
    public void createPending(Trip trip) {
        for (TripStop stop : trip.getStops()) {
            Delivery delivery = new Delivery();
            delivery.setOrder(stop.getOrder());
            delivery.setStop(stop);
            delivery.setTrip(trip);
            delivery.setStatus(DeliveryStatus.PENDING);
            deliveryRepository.save(delivery);
        }
    }

    /** This depot's dispatched/in-progress trips for the date. */
    public List<Trip> activeTrips(CustomUserDetails actor, LocalDate date) {
        return tripRepository.findByDepotIdAndTripDate(actor.getUser().getDepotId(), date).stream()
                .filter(t -> t.getStatus() == TripStatus.DISPATCHED || t.getStatus() == TripStatus.IN_PROGRESS)
                .toList();
    }

    public Trip activeTrip(CustomUserDetails actor, LocalDate date, UUID tripId) {
        List<Trip> candidates = activeTrips(actor, date);
        if (tripId != null) {
            return candidates.stream().filter(t -> t.getId().equals(tripId)).findFirst()
                    .orElseThrow(() -> ApiException.notFound("Trip " + tripId + " is not an active trip for " + date));
        }
        if (candidates.size() > 1) {
            throw ApiException.conflict("More than one trip is active for " + date + " — pick one on the dashboard first.");
        }
        return candidates.stream().findFirst()
                .orElseThrow(() -> ApiException.notFound("No dispatched trip for " + date));
    }

    public List<Delivery> stops(CustomUserDetails actor, LocalDate date, UUID tripId) {
        Trip trip = activeTrip(actor, date, tripId);
        return deliveryRepository.findByTripId(trip.getId()).stream()
                .sorted(Comparator.comparingInt(d -> d.getStop().getSequence()))
                .toList();
    }

    public DriverSummary summary(CustomUserDetails actor, LocalDate date, UUID tripId) {
        Trip trip = activeTrip(actor, date, tripId);
        List<Delivery> deliveries = deliveryRepository.findByTripId(trip.getId()).stream()
                .sorted(Comparator.comparingInt(d -> d.getStop().getSequence()))
                .toList();

        long completed = deliveries.stream().filter(d -> d.getStatus().isOutcome()).count();
        List<Delivery> pending = deliveries.stream().filter(d -> !d.getStatus().isOutcome()).toList();
        double remainingKm = pending.stream().mapToDouble(d -> d.getStop().getDistanceFromPreviousKm()).sum();
        Delivery next = pending.isEmpty() ? null : pending.get(0);

        return new DriverSummary(
                trip.getId(), trip.getStatus().name(), deliveries.size(), (int) completed, pending.size(),
                remainingKm, next == null ? null : next.getOrder().getOrderCode(),
                next == null ? null : next.getOrder().getOutlet().getOutletCode(),
                next == null ? null : next.getStop().getPlannedArrivalTime(),
                next == null ? null : ServiceWindow.close(next.getOrder().getOutlet()));
    }

    @Transactional
    public Trip startTrip(UUID tripId, CustomUserDetails actor) {
        Trip trip = tripService.load(tripId);
        tripService.requireDepot(actor, trip.getDepot());
        tripService.move(trip, TripStatus.IN_PROGRESS, actor.getUser().getId());

        for (Delivery delivery : deliveryRepository.findByTripId(trip.getId())) {
            if (delivery.getStatus() == DeliveryStatus.PENDING) {
                delivery.setStatus(DeliveryStatus.EN_ROUTE);
                deliveryRepository.save(delivery);
            }
            if (delivery.getOrder().getStatus() == OrderStatus.LOADED) {
                orderService.move(delivery.getOrder(), OrderStatus.IN_TRANSIT, "ORDER_IN_TRANSIT",
                        actor.getUser().getId());
            }
        }
        Trip saved = tripRepository.save(trip);
        audit(actor, "TRIP_STARTED", "Trip", saved.getId(), null);
        return saved;
    }

    @Transactional
    public Delivery arrive(UUID stopId, CustomUserDetails actor) {
        Delivery delivery = loadOwned(stopId, actor);
        requireStatus(delivery, DeliveryStatus.EN_ROUTE);
        Order order = delivery.getOrder();
        LocalDate today = LocalDate.now(clock.withZone(ClockConfig.OPERATING_ZONE));
        boolean tripIsToday = delivery.getTrip().getTripDate().equals(today);
        LocalTime arrival = tripIsToday
                ? LocalTime.now(clock.withZone(ClockConfig.OPERATING_ZONE))
                : delivery.getStop().getPlannedArrivalTime();

        delivery.setStatus(DeliveryStatus.ARRIVED);
        delivery.setArrivedAt(Instant.now(clock));
        if (arrival.isAfter(ServiceWindow.close(order.getOutlet()))) {
            delivery.setWindowRisk(WindowRisk.LATE);
            String message = "Arrived at " + order.getOutlet().getOutletCode() + " after its window closed ("
                    + ServiceWindow.close(order.getOutlet()) + ").";
            notificationService.notifyDepotRole(Role.DISPATCHER, delivery.getTrip().getDepot().getId(),
                    "DELIVERY_WINDOW_LATE", "Order", order.getId().toString(), message);
            notificationService.notifyUser(actor.getUser().getId(), "DELIVERY_WINDOW_LATE", "Order",
                    order.getId().toString(), message);
        }
        Delivery saved = deliveryRepository.save(delivery);
        audit(actor, "DRIVER_ARRIVED", "Order", order.getId(), "windowRisk=" + saved.getWindowRisk());
        return saved;
    }

    @Transactional
    public Delivery record(UUID stopId, DeliveryOutcome outcome, Integer deliveredUnits, String podReference,
                           String reason, String notes, CustomUserDetails actor) {
        Delivery delivery = loadOwned(stopId, actor);
        requireStatus(delivery, DeliveryStatus.ARRIVED);
        Order order = delivery.getOrder();
        int units = deliveredUnits == null ? -1 : deliveredUnits;
        validateOutcome(outcome, units, order.getOrderUnits(), reason);

        delivery.setStatus(DeliveryStatus.valueOf(outcome.name()));
        delivery.setDeliveredUnits(units);
        delivery.setPodReference(podReference);
        delivery.setExceptionReason(outcome == DeliveryOutcome.DELIVERED ? null : reason);
        delivery.setNotes(notes);
        Delivery saved = deliveryRepository.save(delivery);

        orderService.move(order, OrderStatus.DELIVERED, "ORDER_DELIVERED", actor.getUser().getId());
        audit(actor, "DELIVERY_RECORDED", "Order", order.getId(),
                "outcome=" + outcome + ",deliveredUnits=" + units);

        UUID depotId = delivery.getTrip().getDepot().getId();
        notificationService.notifyOutletRole(Role.STORE_MANAGER, order.getOutlet().getId(), "DELIVERY_COMPLETED",
                "Order", order.getId().toString(),
                "Order " + order.getOrderCode() + " was " + outcome.name().toLowerCase() + ".");
        if (outcome != DeliveryOutcome.DELIVERED) {
            notificationService.notifyDepotRole(Role.DISPATCHER, depotId, "DELIVERY_EXCEPTION", "Order",
                    order.getId().toString(), "Delivery exception on " + order.getOrderCode() + ": " + reason);
        }
        return saved;
    }

    @Transactional
    public Trip completeTrip(UUID tripId, CustomUserDetails actor) {
        Trip trip = tripService.load(tripId);
        tripService.requireDepot(actor, trip.getDepot());
        tripService.move(trip, TripStatus.COMPLETED, actor.getUser().getId());

        boolean allSettled = deliveryRepository.findByTripId(trip.getId()).stream()
                .allMatch(d -> d.getStatus().isOutcome());
        if (!allSettled) {
            throw ApiException.conflict("Every stop must be recorded before the trip can be completed");
        }
        Trip saved = tripRepository.save(trip);
        audit(actor, "TRIP_COMPLETED", "Trip", saved.getId(), null);
        return saved;
    }

    private void validateOutcome(DeliveryOutcome outcome, int units, int orderUnits, String reason) {
        boolean needsReason = outcome != DeliveryOutcome.DELIVERED;
        if (units < 0) {
            throw ApiException.badRequest("deliveredUnits is required");
        }
        if (needsReason && (reason == null || reason.isBlank())) {
            throw ApiException.badRequest("A reason is required for " + outcome + " deliveries");
        }
        switch (outcome) {
            case DELIVERED -> {
                if (units != orderUnits) throw ApiException.badRequest("DELIVERED requires all " + orderUnits + " units");
            }
            case PARTIAL -> {
                if (units <= 0 || units >= orderUnits) {
                    throw ApiException.badRequest("PARTIAL requires between 1 and " + (orderUnits - 1) + " units");
                }
            }
            case FAILED -> {
                if (units != 0) throw ApiException.badRequest("FAILED requires 0 delivered units");
            }
        }
    }

    private Delivery loadOwned(UUID stopId, CustomUserDetails actor) {
        Delivery delivery = deliveryRepository.findByStopId(stopId)
                .orElseThrow(() -> ApiException.notFound("Stop not found: " + stopId));
        tripService.requireDepot(actor, delivery.getTrip().getDepot());
        return delivery;
    }

    private void requireStatus(Delivery delivery, DeliveryStatus expected) {
        if (delivery.getStatus() != expected) {
            throw ApiException.conflict("Stop is " + delivery.getStatus() + ", expected " + expected);
        }
    }

    private void audit(CustomUserDetails actor, String action, String entityType, UUID entityId, String metadata) {
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), action,
                entityType, entityId.toString(), "API", "SUCCESS", metadata);
    }
}
