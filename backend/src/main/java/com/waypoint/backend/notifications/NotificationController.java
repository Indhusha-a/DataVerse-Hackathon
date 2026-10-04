package com.waypoint.backend.notifications;

import com.waypoint.backend.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal CustomUserDetails actor) {
        return notificationService.list(actor);
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        notificationService.markRead(id, actor);
    }
}
