package com.waypoint.backend.planning;

import com.waypoint.backend.reference.outlet.Outlet;
import com.waypoint.backend.reference.outlet.ServiceWindow;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Simulates a trip's timeline against each stop's delivery window. Arriving early
 * means waiting for the window to open; arriving at or after the close is infeasible.
 */
final class DeliverySchedule {

    private DeliverySchedule() {}

    record Window(double openMin, double closeMin, double serviceMin) {}

    static Window window(Outlet outlet, double serviceMin) {
        return new Window(minutes(ServiceWindow.open(outlet)), minutes(ServiceWindow.close(outlet)), serviceMin);
    }

    static Optional<List<Double>> serviceStarts(double departMin, double outboundMin, double interStopMin,
                                                List<Window> stops) {
        List<Double> starts = new ArrayList<>(stops.size());
        double clock = departMin + outboundMin;
        for (int i = 0; i < stops.size(); i++) {
            Window stop = stops.get(i);
            double start = Math.max(clock, stop.openMin());
            if (start >= stop.closeMin()) return Optional.empty();
            starts.add(start);
            clock = start + stop.serviceMin() + (i + 1 < stops.size() ? interStopMin : 0);
        }
        return Optional.of(starts);
    }

    static double minutes(LocalTime time) {
        return time.toSecondOfDay() / 60.0;
    }

    static LocalTime toLocalTime(double minutes) {
        return LocalTime.ofSecondOfDay(Math.round(minutes * 60));
    }
}
