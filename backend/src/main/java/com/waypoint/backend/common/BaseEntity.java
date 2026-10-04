package com.waypoint.backend.common;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Shared base for every JPA entity: a UUID primary key plus created/updated
 * timestamps that Hibernate fills in automatically. UUIDs (not auto-increment
 * longs) are used everywhere so IDs are safe to generate client-side later
 * (records created offline on the driver app) without collisions.
 */
@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}