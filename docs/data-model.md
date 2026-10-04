# Data model

One PostgreSQL schema, Hibernate-managed (`ddl-auto: update`). Every table carries `id` (UUID), `created_at` and `updated_at` from a shared `BaseEntity`. See [`backend/README.md`](../backend/README.md#domain-model) for the three state machines these tables drive.

## Entity relationships

```mermaid
erDiagram
    DEPOT ||--o{ OUTLET : serves
    DEPOT ||--o{ VEHICLE : houses
    DEPOT ||--o{ PLAN : plans
    OUTLET ||--o{ ORDER : places
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ DEFERRAL : "deferred by"
    PLAN ||--o{ DEFERRAL : "produced by (planning-sourced)"
    PLAN ||--o{ TRIP : produces
    VEHICLE ||--o{ TRIP : runs
    TRIP ||--o{ TRIP_STOP : sequences
    TRIP_STOP }o--|| ORDER : delivers
    TRIP ||--o{ DELIVERY : "one per stop"
    ORDER ||--o| DELIVERY : "delivery attempt"
    ORDER ||--o| RECEIPT : "confirmed by store"
    TRIP ||--o| LOADING_TASK : "loaded as"
    LOADING_TASK ||--o{ LOADING_EVENT : records
    USER ||--o{ ORDER : "places (store manager)"
    USER ||--o{ AUDIT_LOG : "acts in"
    NOTIFICATION ||--o{ NOTIFICATION_READ : "read by"

    ORDER {
        uuid id
        string order_code
        string status
        string temp_requirement
        int order_units
        double order_weight_kg
        double order_volume_m3
        string deferral_reason
    }
    OUTLET {
        uuid id
        string outlet_code
        string brand
        string district
        string dock_type
        string parking_constraint
        time window_open_time
        time window_close_time
    }
    VEHICLE {
        uuid id
        string vehicle_code
        string type
        string temp
        double weight_cap_kg
        double volume_cap_m3
        double km_per_l
        double weekly_fuel_quota_l
    }
    TRIP {
        uuid id
        date trip_date
        int trip_number
        string status
        string brand
        string district
        double total_distance_km
        double fuel_litres
        double planned_duration_min
    }
    TRIP_STOP {
        uuid id
        int sequence
        time planned_arrival_time
        double distance_from_previous_km
        string route_note
    }
    DELIVERY {
        uuid id
        string status
        string window_risk
        int delivered_units
        string pod_reference
        string exception_reason
    }
    RECEIPT {
        uuid id
        int delivered_units
        int received_units
        boolean discrepancy
    }
    DEFERRAL {
        uuid id
        string source
        uuid plan_id
    }
    DOMAIN_EVENT {
        uuid id
        string entity_type
        uuid entity_id
        string event_type
        string previous_state
        string new_state
        uuid user_id
    }
    SYNC_EVENT {
        uuid id
        uuid user_id
        string client_event_id
        string status
        string message
    }
    AUDIT_LOG {
        uuid id
        uuid user_id
        string role
        string action
        string source
        string result
    }
    USER {
        uuid id
        string username
        string role
        uuid depot_id
        uuid outlet_id
        boolean active
    }
    DEPOT {
        uuid id
        string code
        string name
        string district
    }
```

## Tables, grouped by what they're for

**Reference data** (loaded once from the competition dataset, read-mostly): `depot`, `outlet`, `vehicle`, `district_travel`, `service_allowance`, `calendar_day`.

**Order lifecycle**: `order`, `order_item`, `deferral`. An order carries its own temperature requirement, units, weight and volume — the allocation engine reads these directly, never infers them. Each `deferral` row records `source` (`PLANNING` or `DISPATCHER`) and, for a planning-sourced one, the `plan_id` of the run that produced it — so a plan's view only ever shows orders *that run* deferred, not every order that happens to be in `DEFERRED` status depot-wide. A manual dispatcher defer has no `plan_id`.

**Planning and execution**: `plan` (one per depot per date, `DRAFT` → `APPROVED` → `SUPERSEDED`), `trip`, `trip_stop`, `loading_task`, `loading_event`, `delivery`, `receipt`. A `trip_stop` is the join between a `trip` and the `order` it carries — `delivery` and `receipt` hang off the order, one attempt and one confirmation each.

**Cross-cutting**: `domain_event` (one row per state transition, across every lifecycle — the timeline the frontend's history views read), `audit_log` (every write, sign-in and AI tool call, independent of `domain_event`), `sync_event` (the driver's offline queue, keyed by a client-generated id so replay is idempotent), `notification` / `notification_read`.

**Identity**: `user` — `role`, `depot_id` (dispatcher/loader/driver) or `outlet_id` (store manager), `active`. A user's `role` plus `depot_id`/`outlet_id` is what every resource-level filter in the backend checks against (see [Security](../backend/README.md#security)).

## Why two separate event logs

`domain_event` and `audit_log` look similar but answer different questions. `domain_event` is the *business* timeline — "this order went from CONFIRMED to PLANNED at this time" — read by the frontend's history views and, indirectly, by the AI assistant's `get_order_status` tool. `audit_log` is the *security and governance* record — who signed in, who ran what mutation, which AI tool call happened and whether it was permitted — read only by the Admin → Audit log screen. Merging them would mean either business users seeing security noise, or admins losing the distinction between "what happened to this order" and "who did it, from where."
