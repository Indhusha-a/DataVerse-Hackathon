package com.waypoint.backend.planning;

import com.waypoint.backend.orders.Order;
import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.district.DistrictTravel;
import com.waypoint.backend.reference.district.DistrictTravelRepository;
import com.waypoint.backend.reference.outlet.Outlet;
import com.waypoint.backend.reference.outlet.ServiceWindow;
import com.waypoint.backend.reference.vehicle.Vehicle;
import com.waypoint.backend.trips.Trip;
import com.waypoint.backend.trips.TripStatus;
import com.waypoint.backend.trips.TripStop;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Greedy constraint-respecting allocator.
 *
 * Orders are prioritised (previously deferred first, then the longest time since
 * service, then the earliest window close) and grouped by brand and district. Each group is packed into trips, least-fuelled vehicle first. A
 * candidate is accepted only if the whole trip still passes every hard constraint.
 * A final smart en-route pass adds unserved orders to existing routes
 * where every stop stays feasible.
 */
@Component
class AllocationEngine {

    static final int MAX_TRIPS_PER_DAY = 2;
    private static final int NEVER_SERVED_DAYS = 365;

    private final DistrictTravelRepository districtTravels;
    private final TripCalculator calculator;

    AllocationEngine(DistrictTravelRepository districtTravels, TripCalculator calculator) {
        this.districtTravels = districtTravels;
        this.calculator = calculator;
    }

    record Request(
            List<Order> orders,
            Set<UUID> previouslyDeferred,
            Map<UUID, Integer> daysSinceServed,
            List<Vehicle> vehicles,
            Map<UUID, VehicleUsage> usage,
            LocalTime departure,
            LocalDate date,
            Plan plan
    ) {}

    record Result(List<Trip> trips, Map<Order, List<String>> deferred) {}

    private static final class Built {
        final Vehicle vehicle;
        final Brand brand;
        final DistrictTravel travel;
        final int tripNumber;
        final List<Order> orders = new ArrayList<>();
        final Map<UUID, String> routeNotes = new HashMap<>();
        List<Double> serviceStarts = List.of();
        double weightKg;
        double volumeM3;
        double durationMin;
        double fuelLitres;

        Built(Vehicle vehicle, Brand brand, DistrictTravel travel, int tripNumber) {
            this.vehicle = vehicle;
            this.brand = brand;
            this.travel = travel;
            this.tripNumber = tripNumber;
        }
    }

    private record Evaluation(String rejection, List<Double> serviceStarts, double durationMin, double fuelLitres) {
        static Evaluation rejected(String reason) {
            return new Evaluation(reason, null, 0, 0);
        }

        boolean accepted() {
            return rejection == null;
        }
    }

    Result allocate(Request request) {
        Map<Order, LinkedHashSet<String>> reasons = new HashMap<>();
        List<Built> built = new ArrayList<>();
        Set<Order> served = new HashSet<>();

        Map<String, List<Order>> groups = prioritised(request).stream()
                .collect(Collectors.groupingBy(o -> o.getBrand() + "|" + o.getOutlet().getDistrict(),
                        LinkedHashMap::new, Collectors.toList()));
        for (List<Order> group : groups.values()) {
            allocateGroup(group, request, built, reasons, served);
        }
        smartEnRoute(request, built, served);

        List<Trip> trips = built.stream().map(b -> toTrip(b, request)).toList();
        Map<Order, List<String>> deferred = new LinkedHashMap<>();
        for (Order order : request.orders()) {
            if (served.contains(order)) continue;
            LinkedHashSet<String> orderReasons = reasons.getOrDefault(order, new LinkedHashSet<>());
            if (orderReasons.isEmpty()) {
                orderReasons.add("No vehicle has remaining trip, time or fuel capacity");
            }
            deferred.put(order, List.copyOf(orderReasons));
        }
        return new Result(trips, deferred);
    }

    private void allocateGroup(List<Order> group, Request request, List<Built> built,
                               Map<Order, LinkedHashSet<String>> reasons, Set<Order> served) {
        Order first = group.get(0);
        Brand brand = first.getBrand();
        String district = first.getOutlet().getDistrict();

        Optional<DistrictTravel> travel = districtTravels.findByDistrict(district);
        if (travel.isEmpty()) {
            for (Order order : group) reason(reasons, order, "No travel reference for district " + district);
            return;
        }

        List<Order> remaining = new ArrayList<>(group);
        boolean progressed = true;
        while (!remaining.isEmpty() && progressed) {
            progressed = false;
            for (Vehicle vehicle : vehiclesLeastFuelFirst(request)) {
                if (remaining.isEmpty()) break;
                VehicleUsage usage = request.usage().get(vehicle.getId());
                if (usage.trips >= MAX_TRIPS_PER_DAY) continue;

                Built candidate = buildCandidate(vehicle, remaining, brand, travel.get(), usage, request, reasons);
                if (candidate.orders.isEmpty()) continue;

                usage.apply(brand, candidate.durationMin, candidate.fuelLitres);
                built.add(candidate);
                remaining.removeAll(candidate.orders);
                served.addAll(candidate.orders);
                progressed = true;
                break;
            }
        }
    }

    private Built buildCandidate(Vehicle vehicle, List<Order> remaining, Brand brand, DistrictTravel travel,
                                 VehicleUsage usage, Request request, Map<Order, LinkedHashSet<String>> reasons) {
        Built best = new Built(vehicle, brand, travel, usage.trips + 1);
        double budgetLeft = TripCalculator.dailyBudgetMinutes(brand) - usage.minutesFor(brand);
        double fuelLeft = vehicle.getWeeklyFuelQuotaL() - usage.weeklyFuelLitres;

        for (Order order : remaining) {
            List<Order> trial = new ArrayList<>(best.orders);
            trial.add(order);
            sortByDeadline(trial);

            Evaluation evaluation = evaluate(vehicle, order, trial, best.weightKg + order.getOrderWeightKg(),
                    best.volumeM3 + order.getOrderVolumeM3(), brand, travel, budgetLeft, fuelLeft, request.departure());
            if (!evaluation.accepted()) {
                reason(reasons, order, evaluation.rejection());
                continue;
            }
            accept(best, trial, order, evaluation);
        }
        return best;
    }

    private void smartEnRoute(Request request, List<Built> built, Set<Order> served) {
        for (Order order : prioritised(request)) {
            if (served.contains(order)) continue;

            for (Built route : built) {
                if (route.brand != order.getBrand()
                        || !route.travel.getDistrict().equals(order.getOutlet().getDistrict())) {
                    continue;
                }
                VehicleUsage usage = request.usage().get(route.vehicle.getId());
                double budgetLeft = TripCalculator.dailyBudgetMinutes(route.brand)
                        - (usage.minutesFor(route.brand) - route.durationMin);
                double fuelLeft = route.vehicle.getWeeklyFuelQuotaL() - (usage.weeklyFuelLitres - route.fuelLitres);

                List<Order> trial = new ArrayList<>(route.orders);
                trial.add(order);
                sortByDeadline(trial);
                Evaluation evaluation = evaluate(route.vehicle, order, trial, route.weightKg + order.getOrderWeightKg(),
                        route.volumeM3 + order.getOrderVolumeM3(), route.brand, route.travel, budgetLeft, fuelLeft,
                        request.departure());
                if (!evaluation.accepted()) continue;

                double detour = evaluation.durationMin() - route.durationMin;
                usage.addMinutes(route.brand, detour);
                usage.weeklyFuelLitres += evaluation.fuelLitres() - route.fuelLitres;
                route.routeNotes.put(order.getId(), String.format(
                        "Smart route adjustment: +%.0f min detour, all stop windows and constraints remain feasible", detour));
                accept(route, trial, order, evaluation);
                served.add(order);
                break;
            }
        }
    }

    private void accept(Built route, List<Order> trial, Order order, Evaluation evaluation) {
        route.orders.clear();
        route.orders.addAll(trial);
        route.serviceStarts = evaluation.serviceStarts();
        route.weightKg += order.getOrderWeightKg();
        route.volumeM3 += order.getOrderVolumeM3();
        route.durationMin = evaluation.durationMin();
        route.fuelLitres = evaluation.fuelLitres();
    }

    private Evaluation evaluate(Vehicle vehicle, Order order, List<Order> trial, double weight, double volume,
                                Brand brand, DistrictTravel travel, double budgetLeft, double fuelLeft,
                                LocalTime departure) {
        if (!ConstraintValidator.depotMatches(order, vehicle)) {
            return Evaluation.rejected("Outlet is served from a different depot");
        }
        if (!ConstraintValidator.tempCompatible(order, vehicle)) {
            return Evaluation.rejected("Chilled order needs a reefer vehicle");
        }
        if (!ConstraintValidator.vanOnlyCompatible(order, vehicle)) {
            return Evaluation.rejected("Van-only outlet needs a van");
        }
        if (!ConstraintValidator.fitsCapacity(weight, volume, vehicle)) {
            return Evaluation.rejected("Weight or volume capacity exceeded");
        }

        List<Outlet> outlets = trial.stream().map(Order::getOutlet).toList();
        double duration = calculator.durationMinutes(travel, outlets, brand);
        if (duration > budgetLeft) {
            return Evaluation.rejected("Daily time budget exhausted for " + brand);
        }

        List<DeliverySchedule.Window> windows = trial.stream()
                .map(o -> DeliverySchedule.window(o.getOutlet(), calculator.serviceMinutes(brand, o.getOutlet())))
                .toList();
        Optional<List<Double>> starts = DeliverySchedule.serviceStarts(DeliverySchedule.minutes(departure),
                travel.getDepotToDistrictFreeflowMin(), travel.getInterStopFreeflowMin(), windows);
        if (starts.isEmpty()) {
            return Evaluation.rejected("Delivery window cannot be met on this route");
        }

        double fuel = calculator.fuelLitres(calculator.routeKm(travel, trial.size()), vehicle);
        if (fuel > fuelLeft) {
            return Evaluation.rejected("Weekly fuel quota exhausted");
        }
        return new Evaluation(null, starts.get(), duration, fuel);
    }

    private Trip toTrip(Built route, Request request) {
        Trip trip = new Trip();
        trip.setPlan(request.plan());
        trip.setDepot(route.vehicle.getDepot());
        trip.setVehicle(route.vehicle);
        trip.setTripDate(request.date());
        trip.setTripNumber(route.tripNumber);
        trip.setStatus(TripStatus.DRAFT);
        trip.setBrand(route.brand);
        trip.setDistrict(route.travel.getDistrict());
        trip.setTotalWeightKg(route.weightKg);
        trip.setTotalVolumeM3(route.volumeM3);
        trip.setTotalDistanceKm(calculator.routeKm(route.travel, route.orders.size()));
        trip.setFuelLitres(route.fuelLitres);
        trip.setPlannedDurationMin(route.durationMin);

        for (int i = 0; i < route.orders.size(); i++) {
            Order order = route.orders.get(i);
            TripStop stop = new TripStop();
            stop.setTrip(trip);
            stop.setOrder(order);
            stop.setSequence(i + 1);
            stop.setPlannedArrivalTime(DeliverySchedule.toLocalTime(route.serviceStarts.get(i)));
            stop.setDistanceFromPreviousKm(i == 0 ? route.travel.getDepotToDistrictKm() : route.travel.getInterStopKm());
            stop.setRouteNote(route.routeNotes.get(order.getId()));
            trip.getStops().add(stop);
        }
        return trip;
    }

    private List<Order> prioritised(Request request) {
        List<Order> sorted = new ArrayList<>(request.orders());
        sorted.sort(Comparator
                .comparingInt((Order o) -> request.previouslyDeferred().contains(o.getId()) ? 0 : 1)
                .thenComparingInt(o -> -request.daysSinceServed().getOrDefault(o.getOutlet().getId(), NEVER_SERVED_DAYS))
                .thenComparingDouble(this::deadlineMinutes)
                .thenComparing(Order::getCreatedAt));
        return sorted;
    }

    private void sortByDeadline(List<Order> orders) {
        orders.sort(Comparator.comparingDouble(this::deadlineMinutes));
    }

    private double deadlineMinutes(Order order) {
        return DeliverySchedule.minutes(ServiceWindow.close(order.getOutlet()));
    }

    private List<Vehicle> vehiclesLeastFuelFirst(Request request) {
        return request.vehicles().stream()
                .sorted(Comparator.comparingDouble(v -> request.usage().get(v.getId()).weeklyFuelLitres))
                .toList();
    }

    private void reason(Map<Order, LinkedHashSet<String>> reasons, Order order, String reason) {
        reasons.computeIfAbsent(order, o -> new LinkedHashSet<>()).add(reason);
    }
}
