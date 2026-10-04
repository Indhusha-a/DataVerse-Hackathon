package com.waypoint.backend.trips;

import com.waypoint.backend.delivery.DeliveryService;
import com.waypoint.backend.security.CustomUserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;
    private final DeliveryService deliveryService;

    public TripController(TripService tripService, DeliveryService deliveryService) {
        this.tripService = tripService;
        this.deliveryService = deliveryService;
    }

    @GetMapping
    public List<TripResponse> list(@RequestParam LocalDate date, @AuthenticationPrincipal CustomUserDetails actor) {
        return tripService.list(actor, date).stream().map(TripResponse::from).toList();
    }

    @GetMapping("/{id}")
    public TripResponse get(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        return TripResponse.from(tripService.get(id, actor));
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasRole('DISPATCHER')")
    public TripResponse dispatch(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        return TripResponse.from(tripService.dispatch(id, actor));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('DRIVER')")
    public TripResponse complete(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        return TripResponse.from(deliveryService.completeTrip(id, actor));
    }
}
