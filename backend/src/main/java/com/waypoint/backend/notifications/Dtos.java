package com.waypoint.backend.notifications;

import java.time.Instant;
import java.util.UUID;

record NotificationResponse(
        UUID id, String eventType, String entityType, String entityId, String message, boolean read, Instant createdAt
) {
    static NotificationResponse from(Notification n, boolean read) {
        return new NotificationResponse(n.getId(), n.getEventType(), n.getEntityType(), n.getEntityId(),
                n.getMessage(), read, n.getCreatedAt());
    }
}
