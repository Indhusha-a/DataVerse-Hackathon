package com.waypoint.backend.calendar;

import com.waypoint.backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** One row of calendar.csv: whether Waypoint operates on the date. */
@Entity
@Table(name = "calendar_days")
@Getter
@Setter
@NoArgsConstructor
public class CalendarDay extends BaseEntity {

    @Column(unique = true, nullable = false)
    private LocalDate date;

    private boolean operating;
}
