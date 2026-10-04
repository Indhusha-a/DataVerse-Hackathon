package com.waypoint.backend.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, UUID> {

    @Query("select r.notificationId from NotificationRead r where r.userId = :userId")
    Set<UUID> findReadNotificationIds(@Param("userId") UUID userId);

    Optional<NotificationRead> findByUserIdAndNotificationId(UUID userId, UUID notificationId);
}
