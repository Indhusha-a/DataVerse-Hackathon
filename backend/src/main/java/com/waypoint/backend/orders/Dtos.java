package com.waypoint.backend.orders;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

record OrderItemRequest(
        @NotBlank String itemName,
        @Positive int quantity
) {}

record CreateOrderRequest(
        @NotNull UUID outletId,
        @NotNull TempRequirement tempRequirement,
        @Positive int orderUnits,
        @Positive double orderWeightKg,
        @Positive double orderVolumeM3,
        @NotEmpty @Valid List<OrderItemRequest> items
) {}

record UpdateOrderRequest(
        TempRequirement tempRequirement,
        @Positive Integer orderUnits,
        @Positive Double orderWeightKg,
        @Positive Double orderVolumeM3,
        @Valid List<OrderItemRequest> items
) {}

record DeferOrderRequest(
        @NotBlank String reason
) {}

record OrderResponse(
        UUID id, String orderCode, String outletCode, String brand, String status,
        String tempRequirement, int orderUnits, double orderWeightKg, double orderVolumeM3,
        String deferralReason, List<OrderItemResponse> items
) {
    static OrderResponse from(Order o) {
        return new OrderResponse(o.getId(), o.getOrderCode(), o.getOutlet().getOutletCode(),
                o.getBrand().name(), o.getStatus().name(), o.getTempRequirement().name(),
                o.getOrderUnits(), o.getOrderWeightKg(), o.getOrderVolumeM3(), o.getDeferralReason(),
                o.getItems().stream().map(i -> new OrderItemResponse(i.getItemName(), i.getQuantity())).toList());
    }

    record OrderItemResponse(String itemName, int quantity) {}
}
