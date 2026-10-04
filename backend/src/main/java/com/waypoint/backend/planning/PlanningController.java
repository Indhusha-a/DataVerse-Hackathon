package com.waypoint.backend.planning;

import com.waypoint.backend.security.CustomUserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/planning")
@PreAuthorize("hasRole('DISPATCHER')")
public class PlanningController {

    private final PlanningService planningService;

    public PlanningController(PlanningService planningService) {
        this.planningService = planningService;
    }

    @PostMapping("/generate")
    public PlanView generate(@RequestParam LocalDate date, @RequestBody(required = false) GenerateRequest body,
                             @AuthenticationPrincipal CustomUserDetails actor) {
        Set<UUID> orderIds = body == null ? null : body.orderIds();
        return planningService.generate(date, orderIds, actor);
    }

    record GenerateRequest(Set<UUID> orderIds) {}

    @GetMapping("/current")
    public PlanView current(@RequestParam LocalDate date, @AuthenticationPrincipal CustomUserDetails actor) {
        return planningService.current(date, actor);
    }

    @PostMapping("/{planId}/approve")
    public PlanView approve(@PathVariable UUID planId, @AuthenticationPrincipal CustomUserDetails actor) {
        return planningService.approve(planId, actor);
    }

    @PostMapping("/{planId}/replan")
    public PlanView replan(@PathVariable UUID planId, @AuthenticationPrincipal CustomUserDetails actor) {
        return planningService.replan(planId, actor);
    }
}
