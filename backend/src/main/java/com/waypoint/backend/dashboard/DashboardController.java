package com.waypoint.backend.dashboard;

import com.waypoint.backend.security.CustomUserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('DISPATCHER')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/kpis")
    public DashboardService.Kpis kpis(@RequestParam LocalDate date, @AuthenticationPrincipal CustomUserDetails actor) {
        return dashboardService.kpis(actor, date);
    }

    @GetMapping("/alerts")
    public List<DashboardService.Alert> alerts(@AuthenticationPrincipal CustomUserDetails actor) {
        return dashboardService.alerts(actor);
    }
}
