package com.waypoint.backend.security;

import com.waypoint.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * A system account. 'outletId' is set only for STORE_MANAGER users (scopes
 * their visibility to one outlet). 'depotId' is set for DISPATCHER/LOADER/
 * DRIVER users (scopes them to one depot). Both are nullable because ADMIN
 * accounts need neither.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private UUID outletId;
    private UUID depotId;

    @Column(nullable = false)
    private boolean active = true;
}