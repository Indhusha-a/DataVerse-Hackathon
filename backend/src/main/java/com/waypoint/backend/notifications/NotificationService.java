package com.waypoint.backend.notifications;

import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.Role;
import com.waypoint.backend.security.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository readRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationReadRepository readRepository) {
        this.notificationRepository = notificationRepository;
        this.readRepository = readRepository;
    }

    @Transactional
    public void notifyUser(UUID userId, String eventType, String entityType, String entityId, String message) {
        Notification notification = base(eventType, entityType, entityId, message);
        notification.setRecipientUserId(userId);
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyDepotRole(Role role, UUID depotId, String eventType, String entityType, String entityId,
                                String message) {
        Notification notification = base(eventType, entityType, entityId, message);
        notification.setRecipientRole(role);
        notification.setRecipientDepotId(depotId);
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyOutletRole(Role role, UUID outletId, String eventType, String entityType, String entityId,
                                 String message) {
        Notification notification = base(eventType, entityType, entityId, message);
        notification.setRecipientRole(role);
        notification.setRecipientOutletId(outletId);
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> list(CustomUserDetails actor) {
        User user = actor.getUser();
        Set<UUID> read = readRepository.findReadNotificationIds(user.getId());
        return notificationRepository.findVisible(user.getId(), user.getRole(), user.getDepotId(), user.getOutletId())
                .stream()
                .map(n -> NotificationResponse.from(n, read.contains(n.getId())))
                .toList();
    }

    @Transactional
    public void markRead(UUID notificationId, CustomUserDetails actor) {
        User user = actor.getUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Notification not found: " + notificationId));
        boolean visible = user.getId().equals(notification.getRecipientUserId())
                || (notification.getRecipientRole() == user.getRole()
                    && ((notification.getRecipientDepotId() != null
                            && notification.getRecipientDepotId().equals(user.getDepotId()))
                        || (notification.getRecipientOutletId() != null
                            && notification.getRecipientOutletId().equals(user.getOutletId()))));
        if (!visible) {
            throw ApiException.forbidden("Not your notification");
        }
        if (readRepository.findByUserIdAndNotificationId(user.getId(), notificationId).isEmpty()) {
            NotificationRead read = new NotificationRead();
            read.setUserId(user.getId());
            read.setNotificationId(notificationId);
            readRepository.save(read);
        }
    }

    private Notification base(String eventType, String entityType, String entityId, String message) {
        Notification notification = new Notification();
        notification.setEventType(eventType);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);
        notification.setMessage(message);
        return notification;
    }
}
