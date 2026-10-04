package com.waypoint.backend.receipts;

import com.waypoint.backend.audit.AuditService;
import com.waypoint.backend.common.ApiException;
import com.waypoint.backend.common.ClockConfig;
import com.waypoint.backend.delivery.Delivery;
import com.waypoint.backend.delivery.DeliveryRepository;
import com.waypoint.backend.delivery.DeliveryStatus;
import com.waypoint.backend.delivery.WindowRisk;
import com.waypoint.backend.notifications.NotificationService;
import com.waypoint.backend.orders.Order;
import com.waypoint.backend.orders.OrderService;
import com.waypoint.backend.orders.OrderStatus;
import com.waypoint.backend.security.CustomUserDetails;
import com.waypoint.backend.security.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ReceiptService {

    private static final Set<OrderStatus> FINISHED = Set.of(OrderStatus.DELIVERED, OrderStatus.RECEIVED,
            OrderStatus.CLOSED);

    private final OrderService orderService;
    private final DeliveryRepository deliveryRepository;
    private final ReceiptRepository receiptRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public ReceiptService(OrderService orderService, DeliveryRepository deliveryRepository,
                          ReceiptRepository receiptRepository, NotificationService notificationService,
                          AuditService auditService) {
        this.orderService = orderService;
        this.deliveryRepository = deliveryRepository;
        this.receiptRepository = receiptRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    public List<StoreOrderResponse> storeOrders(CustomUserDetails actor) {
        return orderService.list(actor).stream().map(this::storeView).toList();
    }

    public StoreSummary storeSummary(CustomUserDetails actor) {
        List<Order> orders = orderService.list(actor);
        LocalDate today = LocalDate.now(ClockConfig.OPERATING_ZONE);
        List<Order> ordersToday = orders.stream().filter(o -> createdOn(o).equals(today)).toList();

        int inTransit = (int) orders.stream().filter(o -> o.getStatus() == OrderStatus.IN_TRANSIT).count();
        int delivered = (int) orders.stream().filter(o -> FINISHED.contains(o.getStatus())).count();

        int lateRisk = 0;
        List<StoreSummary.Eta> etas = new ArrayList<>();
        for (Order order : orders) {
            Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
            if (delivery == null || delivery.getStatus().isOutcome()) continue;
            if (delivery.getWindowRisk() != WindowRisk.NONE) lateRisk++;
            if (order.getStatus() == OrderStatus.IN_TRANSIT) {
                etas.add(new StoreSummary.Eta(order.getOrderCode(), delivery.getStop().getPlannedArrivalTime()));
            }
        }

        List<StoreOrderResponse> recent = orders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .limit(5)
                .map(this::storeView)
                .toList();
        return new StoreSummary(ordersToday.size(), inTransit, delivered, lateRisk, recent, etas);
    }

    public StoreOrderResponse storeOrder(UUID orderId, CustomUserDetails actor) {
        return storeView(orderService.get(orderId, actor));
    }

    @Transactional
    public StoreOrderResponse confirm(UUID orderId, int receivedUnits, String notes, CustomUserDetails actor) {
        Order order = orderService.get(orderId, actor);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw ApiException.conflict("Order is " + order.getStatus() + ", expected DELIVERED");
        }
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> ApiException.conflict("Order has no delivery record"));
        if (delivery.getStatus() != DeliveryStatus.DELIVERED && delivery.getStatus() != DeliveryStatus.PARTIAL
                && delivery.getStatus() != DeliveryStatus.FAILED) {
            throw ApiException.conflict("Delivery is " + delivery.getStatus() + ", receipt not possible");
        }
        if (receivedUnits < 0) {
            throw ApiException.badRequest("receivedUnits cannot be negative");
        }

        int deliveredUnits = delivery.getDeliveredUnits();
        boolean discrepancy = receivedUnits != deliveredUnits;

        Receipt receipt = new Receipt();
        receipt.setOrder(order);
        receipt.setDeliveredUnits(deliveredUnits);
        receipt.setReceivedUnits(receivedUnits);
        receipt.setDiscrepancy(discrepancy);
        receipt.setNotes(notes);
        receipt.setConfirmedByUserId(actor.getUser().getId());
        receiptRepository.save(receipt);

        delivery.setStatus(DeliveryStatus.RECEIPT_CONFIRMED);
        deliveryRepository.save(delivery);

        orderService.move(order, OrderStatus.RECEIVED, "ORDER_RECEIVED", actor.getUser().getId());
        orderService.move(order, OrderStatus.CLOSED, "ORDER_CLOSED", actor.getUser().getId());

        auditService.log(actor.getUser().getId(), actor.getUser().getRole().name(), "RECEIPT_CONFIRMED",
                "Order", order.getId().toString(), "API", "SUCCESS",
                "deliveredUnits=" + deliveredUnits + ",receivedUnits=" + receivedUnits);
        if (discrepancy) {
            notificationService.notifyDepotRole(Role.DISPATCHER, order.getOutlet().getDepot().getId(),
                    "RECEIPT_DISCREPANCY", "Order", order.getId().toString(),
                    "Receipt discrepancy on " + order.getOrderCode() + ": delivered " + deliveredUnits
                            + ", received " + receivedUnits + ".");
        }
        return storeView(order);
    }

    private LocalDate createdOn(Order order) {
        return order.getCreatedAt().atZone(ClockConfig.OPERATING_ZONE).toLocalDate();
    }

    private StoreOrderResponse storeView(Order order) {
        Delivery delivery = deliveryRepository.findByOrderId(order.getId()).orElse(null);
        Receipt receipt = receiptRepository.findByOrderId(order.getId()).orElse(null);
        return new StoreOrderResponse(
                order.getId(), order.getOrderCode(), order.getStatus().name(), order.getOrderUnits(),
                delivery == null ? null : delivery.getStatus().name(),
                delivery == null ? null : delivery.getDeliveredUnits(),
                receipt == null ? null : receipt.getReceivedUnits(),
                receipt != null && receipt.isDiscrepancy(),
                order.getDeferralReason(),
                delivery == null ? null : delivery.getStop().getPlannedArrivalTime());
    }
}
