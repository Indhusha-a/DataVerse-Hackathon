package com.waypoint.backend.history;

import com.waypoint.backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** One state transition or incident on any tracked entity: orders, plans, trips, loading and deliveries. */
@Entity
@Table(name = "domain_events")
@Getter
@Setter
@NoArgsConstructor
public class DomainEvent extends BaseEntity {

    private String entityType;
    private UUID entityId;
    private String eventType;
    private String previousState;
    private String newState;
    private UUID userId;

    @Column(length = 1000)
    private String metadata;
}
