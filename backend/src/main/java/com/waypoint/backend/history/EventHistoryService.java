package com.waypoint.backend.history;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EventHistoryService {

    private final DomainEventRepository repository;

    public EventHistoryService(DomainEventRepository repository) {
        this.repository = repository;
    }

    public void record(String entityType, UUID entityId, String eventType, String previousState, String newState,
                       UUID userId, String metadata) {
        DomainEvent event = new DomainEvent();
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setEventType(eventType);
        event.setPreviousState(previousState);
        event.setNewState(newState);
        event.setUserId(userId);
        event.setMetadata(metadata);
        repository.save(event);
    }

    public List<DomainEvent> timeline(String entityType, UUID entityId) {
        return repository.findByEntityTypeAndEntityIdOrderByCreatedAtAsc(entityType, entityId);
    }

    public void deleteAll() {
        repository.deleteAll();
    }
}
