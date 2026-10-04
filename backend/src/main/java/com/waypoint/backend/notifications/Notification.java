package com.waypoint.backend.notifications;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.security.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Addressed either to one user, or broadcast to a role within a depot or outlet.
 * Read state is per user, stored in NotificationRead.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification extends BaseEntity {

    private UUID recipientUserId;

    @Enumerated(EnumType.STRING)
    private Role recipientRole;

    private UUID recipientDepotId;
    private UUID recipientOutletId;

    @Column(nullable = false)
    private String eventType;

    private String entityType;
    private String entityId;

    @Column(nullable = false, length = 500)
    private String message;
}
