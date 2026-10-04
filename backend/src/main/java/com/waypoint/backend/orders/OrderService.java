package com.waypoint.backend.orders;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.history.EventHistoryService;
import com.waypoint.backend.notifications.NotificationService;
import com.waypoint.backend.reference.depot.Depot;
import com.waypoint.backend.reference.outlet.Outlet;
import com.waypoint.backend.reference.outlet.OutletRepository;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {

    static final String ENTITY_TYPE = "Order";

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        TRANSITIONS.put(OrderStatus.CREATED, EnumSet.of(OrderStatus.CONFIRMED));
        TRANSITIONS.put(OrderStatus.CONFIRMED, EnumSet.of(OrderStatus.PLANNED, OrderStatus.DEFERRED));
        TRANSITIONS.put(OrderStatus.DEFERRED, EnumSet.of(OrderStatus.PLANNED));
        TRANSITIONS.put(OrderStatus.PLANNED, EnumSet.of(OrderStatus.ALLOCATED, OrderStatus.CONFIRMED));
        TRANSITIONS.put(OrderStatus.ALLOCATED, EnumSet.of(OrderStatus.LOADED));
        TRANSITIONS.put(OrderStatus.LOADED, EnumSet.of(OrderStatus.IN_TRANSIT));
        TRANSITIONS.put(OrderStatus.IN_TRANSIT, EnumSet.of(OrderStatus.DELIVERED));
        TRANSITIONS.put(OrderStatus.DELIVERED, EnumSet.of(OrderStatus.RECEIVED));
        TRANSITIONS.put(OrderStatus.RECEIVED, EnumSet.of(OrderStatus.CLOSED));
        TRANSITIONS.put(OrderStatus.CLOSED, EnumSet.noneOf(OrderStatus.class));
    }

    private final OrderRepository orderRepository;
    private final DeferralRepository deferralRepository;
    private final OutletRepository outletRepository;
    private final AuditService auditService;
    private final EventHistoryService historyService;
    private final NotificationService notificationService;
    private final Clock clock;

    public OrderService(OrderRepository orderRepository, DeferralRepository deferralRepository,
                        OutletRepository outletRepository, AuditService auditService,
                        EventHistoryService historyService, NotificationService notificationService, Clock clock) {
        this.notificationService = notificationService;
        this.orderRepository = orderRepository;
        this.deferralRepository = deferralRepository;
        this.outletRepository = outletRepository;
        this.auditService = auditService;
        this.historyService = historyService;
        this.clock = clock;
    }

    @Transactional
    public Order create(CreateOrderRequest request, CustomUserDetails actor) {
        Outlet outlet = outletRepository.findById(request.outletId())
                .orElseThrow(() -> ApiException.notFound("Outlet not found: " + request.outletId()));
        requireOwnOutlet(actor, outlet);

        Order order = new Order();
        order.setOrderCode(nextOrderCode());
        order.setOutlet(outlet);
        order.setBrand(outlet.getBrand());
        order.setStatus(OrderStatus.CREATED);
        order.setTempRequirement(request.tempRequirement());
        order.setOrderUnits(request.orderUnits());
        order.setOrderWeightKg(request.orderWeightKg());
        order.setOrderVolumeM3(request.orderVolumeM3());
        order.setCreatedByUserId(actor.getUser().getId());
        replaceItems(order, request.items());

        Order saved = orderRepository.save(order);
        historyService.record(ENTITY_TYPE, saved.getId(), "ORDER_CREATED", null, OrderStatus.CREATED.name(),
                actor.getUser().getId(), "outlet=" + outlet.getOutletCode());
        audit(actor, "ORDER_CREATED", saved, "outlet=" + outlet.getOutletCode());
        return saved;
    }

    @Transactional
    public Order update(UUID id, UpdateOrderRequest request, CustomUserDetails actor) {
        Order order = load(id);
        requireOwnOutlet(actor, order.getOutlet());
        if (order.getStatus() != OrderStatus.CREATED) {
            throw ApiException.conflict("Only CREATED orders can be edited, this one is " + order.getStatus());
        }
        if (request.tempRequirement() != null) order.setTempRequirement(request.tempRequirement());
        if (request.orderUnits() != null) order.setOrderUnits(request.orderUnits());
        if (request.orderWeightKg() != null) order.setOrderWeightKg(request.orderWeightKg());
        if (request.orderVolumeM3() != null) order.setOrderVolumeM3(request.orderVolumeM3());
        if (request.items() != null) replaceItems(order, request.items());

        Order saved = orderRepository.save(order);
        audit(actor, "ORDER_UPDATED", saved, null);
        return saved;
    }

    @Transactional
    public Order confirm(UUID id, CustomUserDetails actor) {
        Order order = load(id);
        requireOwnOutlet(actor, order.getOutlet());
        move(order, OrderStatus.CONFIRMED, "ORDER_CONFIRMED", actor.getUser().getId());
        audit(actor, "ORDER_CONFIRMED", order, null);
        return order;
    }

    @Transactional
    public Order defer(UUID id, DeferOrderRequest request, CustomUserDetails actor) {
        Order order = load(id);
        requireDepot(actor, order.getOutlet().getDepot());
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            move(order, OrderStatus.DEFERRED, "ORDER_DEFERRED", actor.getUser().getId());
        } else if (order.getStatus() != OrderStatus.DEFERRED) {
            throw ApiException.conflict("Only CONFIRMED or DEFERRED orders can be deferred, this one is "
                    + order.getStatus());
        }
        recordDeferral(order, DeferralSource.DISPATCHER, List.of(request.reason()), null);
        notificationService.notifyOutletRole(Role.STORE_MANAGER, order.getOutlet().getId(), "ORDER_DEFERRED",
                ENTITY_TYPE, order.getId().toString(),
                "Order " + order.getOrderCode() + " is deferred: " + request.reason() + ".");
        audit(actor, "ORDER_DEFERRED", order, "reason=" + request.reason());
        return order;
    }

    public List<Order> list(CustomUserDetails actor) {
        return switch (actor.getUser().getRole()) {
            case STORE_MANAGER -> orderRepository.findByOutletId(actor.getUser().getOutletId());
            case DISPATCHER, LOADER, DRIVER -> orderRepository.findByOutlet_Depot_Id(actor.getUser().getDepotId());
            case ADMIN -> orderRepository.findAll();
        };
    }

    public Order get(UUID id, CustomUserDetails actor) {
        Order order = load(id);
        Role role = actor.getUser().getRole();
        if (role == Role.STORE_MANAGER) {
            requireOwnOutlet(actor, order.getOutlet());
        } else if (role != Role.ADMIN) {
            requireDepot(actor, order.getOutlet().getDepot());
        }
        return order;
    }

    /** Moves an order along the lifecycle, enforcing the allowed transitions. */
    @Transactional
    public void move(Order order, OrderStatus to, String eventType, UUID userId) {
        OrderStatus from = order.getStatus();
        if (!TRANSITIONS.get(from).contains(to)) {
            throw ApiException.conflict("Illegal order transition " + from + " -> " + to + " for " + order.getOrderCode());
        }
        order.setStatus(to);
        orderRepository.save(order);
        historyService.record(ENTITY_TYPE, order.getId(), eventType, from.name(), to.name(), userId, null);
    }

    @Transactional
    public void recordDeferral(Order order, DeferralSource source, List<String> reasons, UUID planId) {
        Deferral deferral = new Deferral();
        deferral.setOrder(order);
        deferral.setSource(source);
        deferral.setReasons(new ArrayList<>(reasons));
        deferral.setPlanId(planId);
        deferralRepository.save(deferral);
        order.setDeferralReason(String.join("; ", reasons));
        orderRepository.save(order);
    }

    public boolean hasBeenDeferred(UUID orderId) {
        return deferralRepository.existsByOrderId(orderId);
    }

    private Order load(UUID id) {
        return orderRepository.findById(id).orElseThrow(() -> ApiException.notFound("Order not found: " + id));
    }

    private void requireOwnOutlet(CustomUserDetails actor, Outlet outlet) {
        if (actor.getUser().getRole() == Role.STORE_MANAGER
                && !outlet.getId().equals(actor.getUser().getOutletId())) {
            throw ApiException.forbidden("Not your outlet");
        }
    }

    private void requireDepot(CustomUserDetails actor, Depot depot) {
        if (actor.getUser().getRole() != Role.ADMIN && !depot.getId().equals(actor.getUser().getDepotId())) {
            throw ApiException.forbidden("Order does not belong to your depot");
        }
    }

    private void replaceItems(Order order, List<OrderItemRequest> items) {
        order.getItems().clear();
        for (OrderItemRequest itemRequest : items) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setItemName(itemRequest.itemName());
            item.setQuantity(itemRequest.quantity());
            order.getItems().add(item);
        }
    }

    private void audit(CustomUserDetails actor, String action, Order order, String metadata) {
        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), action,
                ENTITY_TYPE, order.getId().toString(), "API", "SUCCESS", metadata);
    }

    private String nextOrderCode() {
        String prefix = "ORD-" + LocalDate.now(clock).format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        return prefix + String.format("%04d", orderRepository.countByOrderCodeStartingWith(prefix) + 1);
    }
}
