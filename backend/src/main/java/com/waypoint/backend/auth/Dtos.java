package com.waypoint.backend.auth;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

record LoginRequest(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password
) {}

record LoginResponse(
        String token,
        UUID userId,
        String username,
        String fullName,
        String role,
        List<String> permissions,
        UUID outletId,
        UUID depotId
) {}

record TokenResponse(String token) {}
