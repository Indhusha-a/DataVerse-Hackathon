package com.waypoint.backend.admin;

import com.waypoint.backend.audit.AuditLog;
import com.waypoint.backend.reference.depot.Depot;
import com.waypoint.backend.security.Role;
import com.waypoint.backend.security.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

/**
 * Request/response shapes for the admin module, grouped in one file — all
 * four are used only by AdminController/AdminUserService in this same
 * package, so none need to be public and all share this one file.
 */

/** POST /api/admin/users request body. */
record CreateUserRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String fullName,
        @NotNull Role role,
        UUID depotId,
        UUID outletId
) {}

/** PATCH /api/admin/users/{id} request body. Admin edits an existing user's
 *  role or active status; username/password changes are intentionally out
 *  of scope here (users manage their own profile elsewhere). */
record UpdateUserRequest(
        @NotNull Role role,
        @NotNull Boolean active
) {}

/** What every admin user-management endpoint sends back. */
record UserResponse(
        UUID id, String username, String fullName, String role, UUID depotId, UUID outletId, boolean active
) {
    static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getRole().name(),
                u.getDepotId(), u.getOutletId(), u.isActive());
    }
}

/** One row in GET /api/admin/depots — lets the admin UI show depot names
 *  and send a real depotId/depotCode instead of a free-text guess. */
record DepotResponse(UUID id, String code, String name, String district) {
    static DepotResponse from(Depot d) {
        return new DepotResponse(d.getId(), d.getCode(), d.getName(), d.getDistrict());
    }
}

/** One row in GET /api/admin/audit-logs. */
record AuditLogResponse(
        UUID id, UUID userId, String role, String action, String entityType,
        String entityId, String source, String result, String metadata, Instant createdAt
) {
    static AuditLogResponse from(AuditLog a) {
        return new AuditLogResponse(a.getId(), a.getUserId(), a.getRole(), a.getAction(), a.getEntityType(),
                a.getEntityId(), a.getSource(), a.getResult(), a.getMetadata(), a.getCreatedAt());
    }
}