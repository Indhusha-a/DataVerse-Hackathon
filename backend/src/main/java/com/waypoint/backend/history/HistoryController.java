package com.waypoint.backend.history;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/history")
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
public class HistoryController {

    private final EventHistoryService historyService;

    public HistoryController(EventHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public List<DomainEvent> timeline(@RequestParam String entityType, @RequestParam UUID entityId) {
        return historyService.timeline(entityType, entityId);
    }
}
