package com.waypoint.backend.calendar;

import com.waypoint.backend.common.ApiException;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * Decides whether Waypoint operates on a date. calendar.csv is authoritative for the
 * dates it covers. For dates beyond it, the booklet's Monday-to-Saturday schedule applies.
 */
@Service
public class CalendarService {

    private final CalendarDayRepository repository;

    public CalendarService(CalendarDayRepository repository) {
        this.repository = repository;
    }

    public void requireOperatingDay(LocalDate date) {
        boolean operating = repository.findByDate(date)
                .map(CalendarDay::isOperating)
                .orElseGet(() -> date.getDayOfWeek() != DayOfWeek.SUNDAY);
        if (!operating) {
            throw ApiException.badRequest(date + " is not an operating day");
        }
    }
}
