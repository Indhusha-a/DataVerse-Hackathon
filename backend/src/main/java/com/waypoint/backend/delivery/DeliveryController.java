package com.waypoint.backend.delivery;

import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.trips.TripResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/driver")
@PreAuthorize("hasRole('DRIVER')")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    /** Candidate trips for the vehicle picker. */
    @GetMapping("/trips")
    public List<TripResponse> activeTrips(@RequestParam LocalDate date, @AuthenticationPrincipal CustomUserDetails actor) {
        return deliveryService.activeTrips(actor, date).stream().map(TripResponse::from).toList();
    }

    @GetMapping("/trip")
    public TripResponse activeTrip(@RequestParam LocalDate date, @RequestParam(required = false) UUID tripId,
                                   @AuthenticationPrincipal CustomUserDetails actor) {
        return TripResponse.from(deliveryService.activeTrip(actor, date, tripId));
    }

    @GetMapping("/summary")
    public DriverSummary summary(@RequestParam LocalDate date, @RequestParam(required = false) UUID tripId,
                                 @AuthenticationPrincipal CustomUserDetails actor) {
        return deliveryService.summary(actor, date, tripId);
    }

    @PostMapping("/trip/{tripId}/start")
    public TripResponse start(@PathVariable UUID tripId, @AuthenticationPrincipal CustomUserDetails actor) {
        return TripResponse.from(deliveryService.startTrip(tripId, actor));
    }

    @GetMapping("/stops")
    public List<StopResponse> stops(@RequestParam LocalDate date, @RequestParam(required = false) UUID tripId,
                                    @AuthenticationPrincipal CustomUserDetails actor) {
        return deliveryService.stops(actor, date, tripId).stream().map(StopResponse::from).toList();
    }

    @PostMapping("/stops/{stopId}/arrive")
    public StopResponse arrive(@PathVariable UUID stopId, @AuthenticationPrincipal CustomUserDetails actor) {
        return StopResponse.from(deliveryService.arrive(stopId, actor));
    }

    @PostMapping("/deliveries")
    public StopResponse record(@Valid @RequestBody DeliveryRequest request,
                               @AuthenticationPrincipal CustomUserDetails actor) {
        return StopResponse.from(deliveryService.record(request.stopId(), request.outcome(),
                request.deliveredUnits(), request.podReference(), request.reason(), request.notes(), actor));
    }
}
