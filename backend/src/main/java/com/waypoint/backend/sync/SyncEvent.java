package com.waypoint.backend.sync;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.delivery.DeliveryOutcome;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** One offline event received from a device, with the outcome of replaying it. */
@Entity
@Table(name = "sync_events", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "client_event_id"}))
@Getter
@Setter
@NoArgsConstructor
public class SyncEvent extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "client_event_id", nullable = false)
    private String clientEventId;

    @Enumerated(EnumType.STRING)
    private SyncEventType type;

    private UUID stopId;

    @Enumerated(EnumType.STRING)
    private DeliveryOutcome outcome;

    private Integer deliveredUnits;
    private String podReference;
    private String reason;
    private String notes;
    private Instant clientTimestamp;

    @Enumerated(EnumType.STRING)
    private SyncStatus status;

    @Column(length = 1000)
    private String message;
}
