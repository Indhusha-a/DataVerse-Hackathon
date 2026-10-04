package com.waypoint.backend.sync;

import com.waypoint.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sync")
@PreAuthorize("hasRole('DRIVER')")
public class SyncController {

    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/events")
    public List<SyncResultResponse> submit(@Valid @RequestBody SyncBatchRequest request,
                                           @AuthenticationPrincipal CustomUserDetails actor) {
        return syncService.submit(request.events(), actor);
    }

    @GetMapping("/status")
    public SyncStatusResponse status(@AuthenticationPrincipal CustomUserDetails actor) {
        return syncService.status(actor);
    }
}
