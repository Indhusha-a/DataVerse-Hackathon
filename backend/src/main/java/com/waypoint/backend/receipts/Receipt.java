package com.waypoint.backend.receipts;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.orders.Order;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** The store manager's confirmation of what physically arrived for an order. */
@Entity
@Table(name = "receipts")
@Getter
@Setter
@NoArgsConstructor
public class Receipt extends BaseEntity {

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    private int deliveredUnits;
    private int receivedUnits;
    private boolean discrepancy;

    @Column(length = 500)
    private String notes;

    private UUID confirmedByUserId;
}
