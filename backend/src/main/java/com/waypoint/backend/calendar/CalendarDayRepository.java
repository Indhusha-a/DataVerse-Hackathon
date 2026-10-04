package com.waypoint.backend.calendar;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface CalendarDayRepository extends JpaRepository<CalendarDay, UUID> {
    Optional<CalendarDay> findByDate(LocalDate date);
}
