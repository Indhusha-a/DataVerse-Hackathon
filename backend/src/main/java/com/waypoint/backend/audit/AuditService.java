package com.waypoint.backend.audit;

import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Thin wrapper other services call to record an audit entry. Kept as one
 * simple method now; every module (orders, admin, later planning/trips) will
 * call this instead of writing to AuditLogRepository directly, so the
 * logging shape stays consistent everywhere.
 */
@Service
public class AuditService {

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void log(UUID userId, String role, String action, String entityType, String entityId,
                     String source, String result, String metadata) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setRole(role);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setSource(source);
        log.setResult(result);
        log.setMetadata(metadata);
        repository.save(log);
    }
}