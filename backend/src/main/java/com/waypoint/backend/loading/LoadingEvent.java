package com.waypoint.backend.loading;

import com.waypoint.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** A timestamped loading event: start, completion, shortfall or damage. */
@Entity
@Table(name = "loading_events")
@Getter
@Setter
@NoArgsConstructor
public class LoadingEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private LoadingTask task;

    @Enumerated(EnumType.STRING)
    private LoadingEventType type;

    private UUID orderId;

    @Column(length = 500)
    private String description;

    private UUID userId;
}
