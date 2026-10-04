package com.waypoint.backend.planning;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.reference.depot.Depot;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One planning run for a depot and day. Its trips stay DRAFT until the plan is approved. */
@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
public class Plan extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "depot_id", nullable = false)
    private Depot depot;

    private LocalDate planDate;

    @Enumerated(EnumType.STRING)
    private PlanStatus status;

    private UUID createdByUserId;
    private Instant approvedAt;
}
