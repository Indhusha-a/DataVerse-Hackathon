package com.waypoint.backend.dashboard;

import com.waypoint.backend.common.ClockConfig;
import com.waypoint.backend.delivery.DeliveryRepository;
import com.waypoint.backend.delivery.WindowRisk;
import com.waypoint.backend.notifications.Notification;
import com.waypoint.backend.notifications.NotificationRepository;
import com.waypoint.backend.orders.Order;
import com.waypoint.backend.orders.OrderRepository;
import com.waypoint.backend.orders.OrderStatus;
import com.waypoint.backend.reference.vehicle.VehicleRepository;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.User;
import com.waypoint.backend.trips.Trip;
import com.waypoint.backend.trips.TripRepository;
import com.waypoint.backend.trips.TripStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** Dispatcher KPIs and alerts, computed from live depot data. */
@Service
public class DashboardService {

    private static final Set<OrderStatus> SERVED = Set.of(OrderStatus.PLANNED, OrderStatus.ALLOCATED,
            OrderStatus.LOADED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.RECEIVED, OrderStatus.CLOSED);
    private static final Set<String> ALERT_TYPES = Set.of("DELIVERY_WINDOW_LATE",
            "LOADING_SHORTFALL", "LOADING_ISSUE", "DELIVERY_EXCEPTION", "RECEIPT_DISCREPANCY", "ORDERS_DEFERRED");

    private final OrderRepository orderRepository;
    private final TripRepository tripRepository;
    private final DeliveryRepository deliveryRepository;
    private final VehicleRepository vehicleRepository;
    private final NotificationRepository notificationRepository;
    private final Clock clock;

    public DashboardService(OrderRepository orderRepository, TripRepository tripRepository,
                            DeliveryRepository deliveryRepository, VehicleRepository vehicleRepository,
                            NotificationRepository notificationRepository, Clock clock) {
        this.orderRepository = orderRepository;
        this.tripRepository = tripRepository;
        this.deliveryRepository = deliveryRepository;
        this.vehicleRepository = vehicleRepository;
        this.notificationRepository = notificationRepository;
        this.clock = clock;
    }

    public Kpis kpis(CustomUserDetails actor, LocalDate date) {
        UUID depotId = actor.getUser().getDepotId();
        List<Order> orders = orderRepository.findByOutlet_Depot_Id(depotId);

        // "Orders today" is the calendar date orders were placed, not the
        // operating day in `date` (usually tomorrow) — those differ by design.
        LocalDate today = LocalDate.now(clock);
        int ordersToday = (int) orders.stream().filter(o -> createdOn(o).equals(today)).count();
        int served = (int) orders.stream().filter(o -> SERVED.contains(o.getStatus())).count();
        int deferred = (int) orders.stream().filter(o -> o.getStatus() == OrderStatus.DEFERRED).count();

        List<Trip> trips = tripRepository.findByDepotIdAndTripDate(depotId, date).stream()
                .filter(t -> t.getStatus() != TripStatus.CANCELLED)
                .toList();
        List<Trip> active = trips.stream()
                .filter(t -> t.getStatus() == TripStatus.LOADING || t.getStatus() == TripStatus.DISPATCHED
                        || t.getStatus() == TripStatus.IN_PROGRESS)
                .toList();
        long vehiclesActive = active.stream().map(t -> t.getVehicle().getId()).distinct().count();

        int lateRisk = (int) trips.stream()
                .flatMap(t -> deliveryRepository.findByTripId(t.getId()).stream())
                .filter(d -> d.getWindowRisk() == WindowRisk.LATE)
                .count();

        double fuelPlanned = trips.stream().mapToDouble(Trip::getFuelLitres).sum();
        double fuelQuota = vehicleRepository.findByDepotId(depotId).stream()
                .mapToDouble(v -> v.getWeeklyFuelQuotaL()).sum();
        double fuelUtilizationPct = fuelQuota == 0 ? 0 : 100.0 * fuelPlanned / fuelQuota;

        return new Kpis(ordersToday, served, deferred, (int) vehiclesActive, active.size(), lateRisk,
                round(fuelPlanned), round(fuelUtilizationPct));
    }

    public List<Alert> alerts(CustomUserDetails actor) {
        User user = actor.getUser();
        List<Alert> alerts = notificationRepository.findVisible(user.getId(), user.getRole(), user.getDepotId(),
                        user.getOutletId()).stream()
                .filter(n -> ALERT_TYPES.contains(n.getEventType()))
                .limit(50)
                .map(this::alert)
                .collect(Collectors.toCollection(java.util.ArrayList::new));

        orderRepository.findByOutlet_Depot_IdAndStatusIn(user.getDepotId(), List.of(OrderStatus.DEFERRED)).stream()
                .filter(o -> o.getDeferralReason() != null && o.getDeferralReason().toLowerCase().contains("capacity"))
                .forEach(o -> alerts.add(new Alert("VEHICLE_CAPACITY_CONFLICT", "AMBER",
                        o.getOrderCode() + " is deferred: " + o.getDeferralReason(), null)));
        return alerts;
    }

    private Alert alert(Notification n) {
        String severity = switch (n.getEventType()) {
            case "DELIVERY_WINDOW_LATE" -> "RED";
            default -> "AMBER";
        };
        return new Alert(n.getEventType(), severity, n.getMessage(), n.getCreatedAt());
    }

    private LocalDate createdOn(Order order) {
        return order.getCreatedAt().atZone(ClockConfig.OPERATING_ZONE).toLocalDate();
    }

    private double round(double value) {
        return Math.round(value * 10) / 10.0;
    }

    public record Kpis(
            int ordersToday, int ordersServed, int ordersDeferred, int vehiclesActive, int tripsActive,
            int lateRiskStops, double fuelPlannedLitres, double fuelUtilizationPct
    ) {}

    public record Alert(String type, String severity, String message, java.time.Instant at) {}
}
