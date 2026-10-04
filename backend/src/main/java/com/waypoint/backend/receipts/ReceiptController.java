package com.waypoint.backend.receipts;

import com.waypoint.backend.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/store/orders")
@PreAuthorize("hasRole('STORE_MANAGER')")
public class ReceiptController {

    private final ReceiptService receiptService;

    public ReceiptController(ReceiptService receiptService) {
        this.receiptService = receiptService;
    }

    @GetMapping
    public List<StoreOrderResponse> list(@AuthenticationPrincipal CustomUserDetails actor) {
        return receiptService.storeOrders(actor);
    }

    @GetMapping("/summary")
    public StoreSummary summary(@AuthenticationPrincipal CustomUserDetails actor) {
        return receiptService.storeSummary(actor);
    }

    @GetMapping("/{id}")
    public StoreOrderResponse get(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails actor) {
        return receiptService.storeOrder(id, actor);
    }

    @PostMapping("/{id}/receive")
    public StoreOrderResponse receive(@PathVariable UUID id, @Valid @RequestBody ReceiveRequest request,
                                      @AuthenticationPrincipal CustomUserDetails actor) {
        return receiptService.confirm(id, request.receivedUnits(), request.notes(), actor);
    }
}
