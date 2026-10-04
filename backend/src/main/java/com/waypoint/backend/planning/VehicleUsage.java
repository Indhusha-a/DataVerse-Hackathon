package com.waypoint.backend.planning;

import com.waypoint.backend.reference.Brand;

/** A vehicle's planned use on the target day and in its ISO week, updated as trips are packed. */
final class VehicleUsage {

    int trips;
    double freshMinutes;
    double styleTechMinutes;
    double weeklyFuelLitres;

    double minutesFor(Brand brand) {
        return brand == Brand.FRESH ? freshMinutes : styleTechMinutes;
    }

    void addMinutes(Brand brand, double minutes) {
        if (brand == Brand.FRESH) {
            freshMinutes += minutes;
        } else {
            styleTechMinutes += minutes;
        }
    }

    void addSameDayTrip(Brand brand, double minutes) {
        trips++;
        addMinutes(brand, minutes);
    }

    void apply(Brand brand, double minutes, double fuelLitres) {
        addSameDayTrip(brand, minutes);
        weeklyFuelLitres += fuelLitres;
    }
}
