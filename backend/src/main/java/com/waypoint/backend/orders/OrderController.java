package com.waypoint.backend.orders;

import com.waypoint.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderResponse> list(@AuthenticationPrincipal CustomUserDetails actor) {
        return orderService.list(actor).stream().map(OrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        return OrderResponse.from(orderService.get(id, actor));
    }

    @PostMapping
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request,
                                @AuthenticationPrincipal CustomUserDetails actor) {
        return OrderResponse.from(orderService.create(request, actor));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public OrderResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateOrderRequest request,
                                @AuthenticationPrincipal CustomUserDetails actor) {
        return OrderResponse.from(orderService.update(id, request, actor));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public OrderResponse confirm(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        return OrderResponse.from(orderService.confirm(id, actor));
    }

    @PostMapping("/{id}/defer")
    @PreAuthorize("hasRole('DISPATCHER')")
    public OrderResponse defer(@PathVariable UUID id, @Valid @RequestBody DeferOrderRequest request,
                               @AuthenticationPrincipal CustomUserDetails actor) {
        return OrderResponse.from(orderService.defer(id, request, actor));
    }
}
