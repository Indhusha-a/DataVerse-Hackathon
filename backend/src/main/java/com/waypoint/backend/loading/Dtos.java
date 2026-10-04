package com.waypoint.backend.loading;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

record LoadingIssueRequest(
        UUID orderId,
        @NotNull LoadingEventType type,
        @NotBlank String description
) {}
