package com.waypoint.backend.loading;

import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.trips.TripResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@PreAuthorize("hasRole('LOADER')")
public class LoadingController {

    private final LoadingService loadingService;

    public LoadingController(LoadingService loadingService) {
        this.loadingService = loadingService;
    }

    @GetMapping("/api/loader/tasks")
    public List<TripResponse> tasks(@RequestParam LocalDate date, @AuthenticationPrincipal CustomUserDetails actor) {
        return loadingService.tasks(actor, date).stream().map(TripResponse::from).toList();
    }

    @GetMapping("/api/loading/{tripId}/events")
    @PreAuthorize("hasAnyRole('LOADER', 'DISPATCHER')")
    public List<LoadingEventResponse> events(@PathVariable UUID tripId,
                                             @AuthenticationPrincipal CustomUserDetails actor) {
        return loadingService.events(tripId, actor).stream().map(LoadingEventResponse::from).toList();
    }

    @PostMapping("/api/loading/{tripId}/start")
    public TripResponse start(@PathVariable UUID tripId, @AuthenticationPrincipal CustomUserDetails actor) {
        return TripResponse.from(loadingService.start(tripId, actor));
    }

    @PostMapping("/api/loading/{tripId}/complete")
    public TripResponse complete(@PathVariable UUID tripId, @AuthenticationPrincipal CustomUserDetails actor) {
        return TripResponse.from(loadingService.complete(tripId, actor));
    }

    @PostMapping("/api/loading/{tripId}/issue")
    public void issue(@PathVariable UUID tripId, @Valid @RequestBody LoadingIssueRequest request,
                      @AuthenticationPrincipal CustomUserDetails actor) {
        loadingService.reportIssue(tripId, request.orderId(), request.type(), request.description(), actor);
    }

    record LoadingEventResponse(LoadingEventType type, UUID orderId, String description, Instant at) {
        static LoadingEventResponse from(LoadingEvent e) {
            return new LoadingEventResponse(e.getType(), e.getOrderId(), e.getDescription(), e.getCreatedAt());
        }
    }
}
