package com.waypoint.backend.planning;

import com.waypoint.backend.reference.vehicle.VehicleRepository;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.trips.TripRepository;
import com.waypoint.backend.trips.TripStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
class FleetController {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    FleetController(VehicleRepository vehicleRepository, TripRepository tripRepository) {
        this.vehicleRepository = vehicleRepository;
        this.tripRepository = tripRepository;
    }

    @GetMapping("/available")
    public List<VehicleAvailability> available(@RequestParam LocalDate date,
                                               @AuthenticationPrincipal CustomUserDetails actor) {
        return vehicleRepository.findByDepotId(actor.getUser().getDepotId()).stream()
                .map(vehicle -> {
                    long trips = tripRepository.findByVehicleIdAndTripDateBetween(vehicle.getId(), date, date).stream()
                            .filter(t -> t.getStatus() != TripStatus.CANCELLED)
                            .count();
                    return new VehicleAvailability(vehicle.getId(), vehicle.getVehicleCode(), vehicle.getType(),
                            vehicle.getTemp(), (int) trips, AllocationEngine.MAX_TRIPS_PER_DAY);
                })
                .filter(a -> a.tripsToday() < a.maxTripsPerDay())
                .toList();
    }
}
