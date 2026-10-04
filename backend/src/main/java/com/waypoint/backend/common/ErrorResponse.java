package com.waypoint.backend.common;

import java.time.Instant;

/**
 * The JSON shape every error response takes, so the frontend can rely on one
 * consistent structure regardless of which endpoint or exception type fired.
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}