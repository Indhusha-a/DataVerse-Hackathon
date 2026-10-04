package com.waypoint.backend.orders;

import com.waypoint.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** One deferral decision for one order, with its structured reasons. */
@Entity
@Table(name = "deferrals")
@Getter
@Setter
@NoArgsConstructor
public class Deferral extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    private DeferralSource source;

    /** The plan whose allocation run produced this deferral — null for a
     * dispatcher's manual defer, which isn't tied to any plan. */
    private UUID planId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "deferral_reasons", joinColumns = @JoinColumn(name = "deferral_id"))
    @Column(name = "reason", nullable = false, length = 500)
    private List<String> reasons = new ArrayList<>();
}
