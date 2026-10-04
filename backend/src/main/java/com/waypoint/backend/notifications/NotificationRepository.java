package com.waypoint.backend.notifications;

import com.waypoint.backend.security.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("""
            select n from Notification n
            where n.recipientUserId = :userId
               or (n.recipientRole = :role and (n.recipientDepotId = :depotId or n.recipientOutletId = :outletId))
            order by n.createdAt desc
            """)
    List<Notification> findVisible(@Param("userId") UUID userId, @Param("role") Role role,
                                   @Param("depotId") UUID depotId, @Param("outletId") UUID outletId);
}
