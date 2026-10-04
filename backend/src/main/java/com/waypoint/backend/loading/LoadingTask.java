package com.waypoint.backend.loading;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.trips.Trip;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** The loader's work on one trip. Exactly one task exists per trip. */
@Entity
@Table(name = "loading_tasks")
@Getter
@Setter
@NoArgsConstructor
public class LoadingTask extends BaseEntity {

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "trip_id", nullable = false, unique = true)
    private Trip trip;

    @Enumerated(EnumType.STRING)
    private LoadingStatus status;

    private UUID loaderUserId;
    private Instant startedAt;
    private Instant completedAt;
}
