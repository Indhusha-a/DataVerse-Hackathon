package com.waypoint.backend.planning;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.calendar.CalendarService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.common.ClockConfig;
import com.waypoint.backend.delivery.DeliveryService;
import com.waypoint.backend.notifications.NotificationService;
import com.waypoint.backend.orders.Deferral;
import com.waypoint.backend.orders.DeferralRepository;
import com.waypoint.backend.orders.DeferralSource;
import com.waypoint.backend.orders.Order;
import com.waypoint.backend.orders.OrderService;
import com.waypoint.backend.orders.OrderStatus;
import com.waypoint.backend.orders.OrderRepository;
import com.waypoint.backend.reference.depot.Depot;
import com.waypoint.backend.reference.depot.DepotRepository;
import com.waypoint.backend.reference.vehicle.Vehicle;
import com.waypoint.backend.reference.vehicle.VehicleRepository;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.Role;
import com.waypoint.backend.trips.Trip;
import com.waypoint.backend.trips.TripRepository;
import com.waypoint.backend.trips.TripResponse;
import com.waypoint.backend.trips.TripStopRepository;
import com.waypoint.backend.trips.TripService;
import com.waypoint.backend.trips.TripStatus;
import com.waypoint.backend.trips.TripStop;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlanningService {

    static final LocalTime DEPOT_DEPARTURE = LocalTime.of(3, 30);
    static final LocalTime ORDER_CUTOFF = LocalTime.of(16, 0);
    private static final int NEVER_SERVED_DAYS = 365;

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final TripStopRepository tripStopRepository;
    private final CalendarService calendarService;
    private final PlanRepository planRepository;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;
    private final TripService tripService;
    private final DeliveryService deliveryService;
    private final DepotRepository depotRepository;
    private final AllocationEngine allocationEngine;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final Clock clock;
    private final DeferralRepository deferralRepository;

    public PlanningService(OrderRepository orderRepository, OrderService orderService,
                           TripStopRepository tripStopRepository, CalendarService calendarService, PlanRepository planRepository,
                           VehicleRepository vehicleRepository, TripRepository tripRepository, TripService tripService,
                           DeliveryService deliveryService, DepotRepository depotRepository,
                           AllocationEngine allocationEngine, NotificationService notificationService,
                           AuditService auditService, Clock clock, DeferralRepository deferralRepository) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.tripStopRepository = tripStopRepository;
        this.calendarService = calendarService;
        this.planRepository = planRepository;
        this.vehicleRepository = vehicleRepository;
        this.tripRepository = tripRepository;
        this.tripService = tripService;
        this.deliveryService = deliveryService;
        this.depotRepository = depotRepository;
        this.allocationEngine = allocationEngine;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.clock = clock;
        this.deferralRepository = deferralRepository;
    }

    @Transactional
    public PlanView generate(LocalDate date, Set<UUID> orderIds, CustomUserDetails actor) {
        Plan plan = createDraft(date, orderIds, actor);
        return view(plan);
    }

    @Transactional
    public PlanView current(LocalDate date, CustomUserDetails actor) {
        Depot depot = depot(actor);
        // A DRAFT and an APPROVED plan can briefly coexist for the same date; the
        // draft takes priority since it's the one awaiting review.
        List<Plan> candidates = planRepository.findByDepotIdAndPlanDateAndStatusIn(depot.getId(), date,
                List.of(PlanStatus.DRAFT, PlanStatus.APPROVED));
        Plan plan = candidates.stream().filter(p -> p.getStatus() == PlanStatus.DRAFT).findFirst()
                .or(() -> candidates.stream().findFirst())
                .orElseThrow(() -> ApiException.notFound("No plan exists for " + date));
        return view(plan);
    }

    @Transactional
    public PlanView approve(UUID planId, CustomUserDetails actor) {
        Plan plan = loadOwnDraft(planId, actor);
        plan.setStatus(PlanStatus.APPROVED);
        plan.setApprovedAt(Instant.now(clock));
        planRepository.save(plan);

        for (Trip trip : tripRepository.findByPlanId(plan.getId())) {
            if (trip.getStatus() != TripStatus.DRAFT) continue;
            tripService.move(trip, TripStatus.PLANNED, actor.getUser().getId());
            for (TripStop stop : trip.getStops()) {
                orderService.move(stop.getOrder(), OrderStatus.ALLOCATED, "ORDER_ALLOCATED", actor.getUser().getId());
            }
            tripRepository.save(trip);
            deliveryService.createPending(trip);
        }

        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "PLAN_APPROVED",
                "Plan", plan.getId().toString(), "API", "SUCCESS", "date=" + plan.getPlanDate());
        return view(plan);
    }

    @Transactional
    public PlanView replan(UUID planId, CustomUserDetails actor) {
        Plan plan = loadOwnDraft(planId, actor);
        for (Trip trip : tripRepository.findByPlanId(plan.getId())) {
            for (TripStop stop : trip.getStops()) {
                orderService.move(stop.getOrder(), OrderStatus.CONFIRMED, "ORDER_REPLANNED", actor.getUser().getId());
            }
            tripService.move(trip, TripStatus.CANCELLED, actor.getUser().getId());
            tripRepository.save(trip);
        }
        plan.setStatus(PlanStatus.SUPERSEDED);
        planRepository.save(plan);

        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "PLAN_SUPERSEDED",
                "Plan", plan.getId().toString(), "API", "SUCCESS", null);
        return generate(plan.getPlanDate(), null, actor);
    }

    private Plan createDraft(LocalDate date, Set<UUID> orderIds, CustomUserDetails actor) {
        calendarService.requireOperatingDay(date);
        Depot depot = depot(actor);
        if (planRepository.findFirstByDepotIdAndPlanDateAndStatusIn(depot.getId(), date,
                List.of(PlanStatus.DRAFT)).isPresent()) {
            throw ApiException.conflict("A draft plan already exists for " + date + ". Approve or replan it first.");
        }

        Instant cutoff = date.minusDays(1).atTime(ORDER_CUTOFF).atZone(ClockConfig.OPERATING_ZONE).toInstant();
        // null/empty orderIds = plan every eligible order (unchanged default behaviour)
        List<Order> eligible = orderRepository
                .findByOutlet_Depot_IdAndStatusIn(depot.getId(), List.of(OrderStatus.CONFIRMED, OrderStatus.DEFERRED))
                .stream()
                .filter(o -> o.getCreatedAt().isBefore(cutoff))
                .filter(o -> orderIds == null || orderIds.isEmpty() || orderIds.contains(o.getId()))
                .toList();
        Set<UUID> previouslyDeferred = eligible.stream()
                .filter(o -> orderService.hasBeenDeferred(o.getId()))
                .map(Order::getId)
                .collect(Collectors.toSet());

        List<Vehicle> vehicles = vehicleRepository.findByDepotId(depot.getId());
        Plan plan = new Plan();
        plan.setDepot(depot);
        plan.setPlanDate(date);
        plan.setStatus(PlanStatus.DRAFT);
        plan.setCreatedByUserId(actor.getUser().getId());
        planRepository.save(plan);

        Map<UUID, Integer> daysSinceServed = new HashMap<>();
        for (Order order : eligible) {
            UUID outletId = order.getOutlet().getId();
            if (daysSinceServed.containsKey(outletId)) continue;
            LocalDate lastServed = tripStopRepository.findLastServedDate(outletId, TripStatus.COMPLETED, date);
            daysSinceServed.put(outletId, lastServed == null ? NEVER_SERVED_DAYS
                    : (int) ChronoUnit.DAYS.between(lastServed, date));
        }

        AllocationEngine.Result result = allocationEngine.allocate(new AllocationEngine.Request(
                eligible, previouslyDeferred, daysSinceServed, vehicles, usageFor(vehicles, date),
                DEPOT_DEPARTURE, date, plan));

        tripRepository.saveAll(result.trips());
        UUID userId = actor.getUser().getId();
        for (Trip trip : result.trips()) {
            for (TripStop stop : trip.getStops()) {
                orderService.move(stop.getOrder(), OrderStatus.PLANNED, "ORDER_PLANNED", userId);
            }
        }
        for (Map.Entry<Order, List<String>> entry : result.deferred().entrySet()) {
            Order order = entry.getKey();
            if (order.getStatus() == OrderStatus.CONFIRMED) {
                orderService.move(order, OrderStatus.DEFERRED, "ORDER_DEFERRED", userId);
            }
            orderService.recordDeferral(order, DeferralSource.PLANNING, entry.getValue(), plan.getId());
            notificationService.notifyOutletRole(Role.STORE_MANAGER, order.getOutlet().getId(), "ORDER_DEFERRED",
                    "Order", order.getId().toString(), "Order " + order.getOrderCode() + " is deferred: "
                            + String.join("; ", entry.getValue()) + ". It will be considered in the next planning cycle.");
        }

        auditService.log(userId, actor.getUser().getRole().name(), "PLAN_GENERATED", "Plan",
                plan.getId().toString(), "API", "SUCCESS",
                "trips=" + result.trips().size() + ",deferred=" + result.deferred().size());
        if (!result.deferred().isEmpty()) {
            notificationService.notifyDepotRole(Role.DISPATCHER, depot.getId(), "ORDERS_DEFERRED", "Plan",
                    plan.getId().toString(),
                    result.deferred().size() + " order(s) deferred in the " + depot.getCode() + " plan for " + date + ".");
        }
        return plan;
    }

    private Map<UUID, VehicleUsage> usageFor(List<Vehicle> vehicles, LocalDate date) {
        LocalDate weekStart = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);
        Map<UUID, VehicleUsage> usage = new HashMap<>();
        for (Vehicle vehicle : vehicles) {
            VehicleUsage vehicleUsage = new VehicleUsage();
            for (Trip trip : tripRepository.findByVehicleIdAndTripDateBetween(vehicle.getId(), weekStart, weekEnd)) {
                if (trip.getStatus() == TripStatus.CANCELLED) continue;
                vehicleUsage.weeklyFuelLitres += trip.getFuelLitres();
                if (trip.getTripDate().equals(date)) {
                    vehicleUsage.addSameDayTrip(trip.getBrand(), trip.getPlannedDurationMin());
                }
            }
            usage.put(vehicle.getId(), vehicleUsage);
        }
        return usage;
    }

    private Plan loadOwnDraft(UUID planId, CustomUserDetails actor) {
        Plan plan = planRepository.findById(planId).orElseThrow(() -> ApiException.notFound("Plan not found: " + planId));
        if (!plan.getDepot().getId().equals(actor.getUser().getDepotId())) {
            throw ApiException.forbidden("Plan does not belong to your depot");
        }
        if (plan.getStatus() != PlanStatus.DRAFT) {
            throw ApiException.conflict("Plan is " + plan.getStatus() + ", only DRAFT plans can change");
        }
        return plan;
    }

    private Depot depot(CustomUserDetails actor) {
        return depotRepository.findById(actor.getUser().getDepotId())
                .orElseThrow(() -> ApiException.forbidden("Your account has no depot"));
    }

    private PlanView view(Plan plan) {
        List<Trip> trips = tripRepository.findByPlanId(plan.getId());
        List<PlanView.DeferredOrder> deferred = deferralRepository.findByPlanId(plan.getId()).stream()
                .map(d -> new PlanView.DeferredOrder(d.getOrder().getOrderCode(),
                        d.getOrder().getOutlet().getOutletCode(), d.getReasons()))
                .toList();
        return new PlanView(plan.getId(), plan.getPlanDate(), plan.getStatus().name(),
                trips.stream().filter(t -> t.getStatus() != TripStatus.CANCELLED).map(TripResponse::from).toList(),
                deferred);
    }
}
