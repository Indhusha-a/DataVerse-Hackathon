package com.waypoint.backend.security;

import java.util.List;

/**
 * The five roles. ADMIN is the technical role for user, fleet and demo-data
 * management; the four operational roles are the ones the business workflow runs on.
 */
public enum Role {
    DISPATCHER(List.of("VIEW_ORDERS", "GENERATE_PLAN", "APPROVE_PLAN", "REPLAN", "DISPATCH_TRIP",
            "DEFER_ORDER", "VIEW_TRIPS", "VIEW_FLEET_AVAILABILITY")),
    LOADER(List.of("VIEW_LOADING_TASKS", "START_LOADING", "COMPLETE_LOADING", "REPORT_LOADING_ISSUE")),
    DRIVER(List.of("VIEW_MY_TRIP", "VIEW_MY_STOPS", "START_TRIP", "UPDATE_DELIVERY", "COMPLETE_TRIP",
            "SYNC_OFFLINE_EVENTS")),
    STORE_MANAGER(List.of("CREATE_ORDER", "EDIT_ORDER", "CONFIRM_ORDER", "VIEW_OUTLET_ORDERS", "CONFIRM_RECEIPT")),
    ADMIN(List.of("MANAGE_USERS", "MANAGE_FLEET", "VIEW_AUDIT_LOG", "MANAGE_DEMO_DATA", "VIEW_SYSTEM_HEALTH"));

    private final List<String> permissions;

    Role(List<String> permissions) {
        this.permissions = permissions;
    }

    public List<String> permissions() {
        return permissions;
    }
}
