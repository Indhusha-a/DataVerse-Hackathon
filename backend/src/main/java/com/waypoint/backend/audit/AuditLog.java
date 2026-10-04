package com.waypoint.backend.audit;

import com.waypoint.backend.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * One row per significant action in the system (login, order created, order
 * deferred, admin user-management actions, etc). This is what the Admin
 * module's audit viewer reads from, and what AI-assisted actions are logged
 * into as well, per the governance model.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog extends BaseEntity {

    private UUID userId;
    private String role;
    private String action;      // e.g. "ORDER_CREATED", "USER_ROLE_CHANGED"
    private String entityType;  // e.g. "Order", "User"
    private String entityId;
    private String source;      // e.g. "WEB", "API", "SEED"
    private String result;      // e.g. "SUCCESS", "FAILURE"

    @jakarta.persistence.Column(length = 2000)
    private String metadata;    // free-form JSON string with extra context
}