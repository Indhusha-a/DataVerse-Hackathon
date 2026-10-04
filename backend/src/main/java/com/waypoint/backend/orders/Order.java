package com.waypoint.backend.orders;

import com.waypoint.backend.common.BaseEntity;
import com.waypoint.backend.reference.Brand;
import com.waypoint.backend.reference.outlet.Outlet;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String orderCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @Enumerated(EnumType.STRING)
    private Brand brand;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    private TempRequirement tempRequirement;

    private int orderUnits;
    private double orderWeightKg;
    private double orderVolumeM3;

    private UUID createdByUserId;

    /** Latest deferral reasons, joined. The full history lives in Deferral. */
    private String deferralReason;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();
}
