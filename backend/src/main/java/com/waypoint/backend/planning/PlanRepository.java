package com.waypoint.backend.planning;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
    Optional<Plan> findFirstByDepotIdAndPlanDateAndStatusIn(UUID depotId, LocalDate planDate,
                                                            Collection<PlanStatus> statuses);

    java.util.List<Plan> findByDepotIdAndPlanDateAndStatusIn(UUID depotId, LocalDate planDate,
                                                              Collection<PlanStatus> statuses);
}
