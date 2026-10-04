package com.waypoint.backend.reference.outlet;

import com.waypoint.backend.reference.Brand;

import java.time.LocalTime;

/**
 * An outlet's effective delivery window: its own window, narrowed to the mall access
 * window where one applies, and capped at 08:00 for Fresh, which must arrive before stores open.
 */
public final class ServiceWindow {

    static final LocalTime FRESH_LATEST_CLOSE = LocalTime.of(8, 0);

    private ServiceWindow() {}

    public static LocalTime open(Outlet outlet) {
        LocalTime open = outlet.getWindowOpenTime();
        if (outlet.getMallWindowStart() != null && outlet.getMallWindowStart().isAfter(open)) {
            return outlet.getMallWindowStart();
        }
        return open;
    }

    public static LocalTime close(Outlet outlet) {
        LocalTime close = outlet.getWindowCloseTime();
        if (outlet.getMallWindowEnd() != null && outlet.getMallWindowEnd().isBefore(close)) {
            close = outlet.getMallWindowEnd();
        }
        if (outlet.getBrand() == Brand.FRESH && close.isAfter(FRESH_LATEST_CLOSE)) {
            close = FRESH_LATEST_CLOSE;
        }
        return close;
    }
}
