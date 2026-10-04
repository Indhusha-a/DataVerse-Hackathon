package com.waypoint.backend.admin;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.delivery.DeliveryRepository;
import com.waypoint.backend.history.EventHistoryService;
import com.waypoint.backend.loading.LoadingEventRepository;
import com.waypoint.backend.loading.LoadingTaskRepository;
import com.waypoint.backend.notifications.NotificationReadRepository;
import com.waypoint.backend.notifications.NotificationRepository;
import com.waypoint.backend.orders.DeferralRepository;
import com.waypoint.backend.orders.OrderRepository;
import com.waypoint.backend.planning.PlanRepository;
import com.waypoint.backend.receipts.ReceiptRepository;
import com.waypoint.backend.reference.vehicle.VehicleRepository;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.UserRepository;
import com.waypoint.backend.seed.DataSeeder;
import com.waypoint.backend.sync.SyncEventRepository;
import com.waypoint.backend.trips.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/** Operational demo data management. Users, reference data and the audit log are kept. */
@Service
class AdminDemoService {

    private final SyncEventRepository syncEventRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final NotificationRepository notificationRepository;
    private final ReceiptRepository receiptRepository;
    private final DeliveryRepository deliveryRepository;
    private final LoadingEventRepository loadingEventRepository;
    private final LoadingTaskRepository loadingTaskRepository;
    private final DeferralRepository deferralRepository;
    private final EventHistoryService historyService;
    private final OrderRepository orderRepository;
    private final TripRepository tripRepository;
    private final PlanRepository planRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DataSeeder dataSeeder;
    private final AuditService auditService;

    AdminDemoService(SyncEventRepository syncEventRepository, NotificationReadRepository notificationReadRepository,
                     NotificationRepository notificationRepository, ReceiptRepository receiptRepository,
                     DeliveryRepository deliveryRepository, LoadingEventRepository loadingEventRepository,
                     LoadingTaskRepository loadingTaskRepository, DeferralRepository deferralRepository,
                     EventHistoryService historyService, OrderRepository orderRepository,
                     TripRepository tripRepository, PlanRepository planRepository, UserRepository userRepository,
                     VehicleRepository vehicleRepository, DataSeeder dataSeeder, AuditService auditService) {
        this.syncEventRepository = syncEventRepository;
        this.notificationReadRepository = notificationReadRepository;
        this.notificationRepository = notificationRepository;
        this.receiptRepository = receiptRepository;
        this.deliveryRepository = deliveryRepository;
        this.loadingEventRepository = loadingEventRepository;
        this.loadingTaskRepository = loadingTaskRepository;
        this.deferralRepository = deferralRepository;
        this.historyService = historyService;
        this.orderRepository = orderRepository;
        this.tripRepository = tripRepository;
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.dataSeeder = dataSeeder;
        this.auditService = auditService;
    }

    /** Deletes in dependency order: referencing rows first, then trips, orders and plans. */
    @Transactional
    public void reset(CustomUserDetails actor) {
        syncEventRepository.deleteAll();
        notificationReadRepository.deleteAll();
        notificationRepository.deleteAll();
        receiptRepository.deleteAll();
        deliveryRepository.deleteAll();
        loadingEventRepository.deleteAll();
        loadingTaskRepository.deleteAll();
        deferralRepository.deleteAll();
        historyService.deleteAll();
        tripRepository.deleteAll();
        orderRepository.deleteAll();
        planRepository.deleteAll();
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "DEMO_DATA_RESET",
                "System", null, "API", "SUCCESS", null);
    }

    public void seed(CustomUserDetails actor) throws IOException {
        dataSeeder.seedAll();
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "DEMO_DATA_SEEDED",
                "System", null, "API", "SUCCESS", null);
    }

    public Map<String, Object> health() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("database", databaseUp() ? "UP" : "DOWN");
        health.put("users", userRepository.count());
        health.put("vehicles", vehicleRepository.count());
        health.put("orders", orderRepository.count());
        health.put("plans", planRepository.count());
        health.put("trips", tripRepository.count());
        health.put("deliveries", deliveryRepository.count());
        health.put("receipts", receiptRepository.count());
        health.put("syncEvents", syncEventRepository.count());
        return health;
    }

    private boolean databaseUp() {
        try {
            userRepository.count();
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }
}
