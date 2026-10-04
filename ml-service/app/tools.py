"""
Read-only tools the agent can call. Each tool is a thin wrapper around an
existing Spring Boot endpoint and is called with the caller's own JWT. This
service never touches PostgreSQL directly and holds no backend credentials.

Mutating actions (defer, dispatch, confirm delivery) are not exposed to the
agent. Those need a confirmation step before the agent may trigger them.
"""

import json

import httpx
from app.config import settings


async def _get(path: str, jwt: str, params: dict | None = None) -> dict | list:
    async with httpx.AsyncClient(base_url=settings.backend_base_url, timeout=10.0) as client:
        response = await client.get(path, params=params, headers={"Authorization": f"Bearer {jwt}"})
        response.raise_for_status()
        return response.json()


async def get_order_status(args: dict, jwt: str, role: str) -> dict:
    """args: {"order_code": "ORD-20261002-0001"}. No single-order-by-code
    endpoint exists on the backend, so this lists the caller's visible
    orders (already role-scoped server-side by OrderService.listOrders)
    and matches by code."""
    order_code = args.get("order_code", "")
    orders = await _get("/api/orders", jwt)
    match = next((o for o in orders if o.get("orderCode") == order_code), None)
    if match is None:
        return {"found": False, "order_code": order_code}
    return {"found": True, **match}


async def get_today_trips(args: dict, jwt: str, role: str) -> dict:
    """args: {"date": "2026-10-02"}. Which endpoint to call depends on role
    — Dispatcher/Admin see the depot's full trip list, Loader sees loading
    tasks, Driver sees dispatched/in-progress trips. All three endpoints
    already filter server-side by the caller's depotId."""
    date = args.get("date")
    if role in ("DISPATCHER", "ADMIN"):
        return {"trips": await _get("/api/trips", jwt, params={"date": date})}
    if role == "LOADER":
        return {"trips": await _get("/api/loader/tasks", jwt, params={"date": date})}
    if role == "DRIVER":
        try:
            return {"trips": [await _get("/api/driver/trip", jwt, params={"date": date})]}
        except httpx.HTTPStatusError as error:
            if error.response.status_code == 404:
                return {"trips": []}
            raise
    return {"error": "No trip view available for this role"}


async def get_deferred_orders(args: dict, jwt: str, role: str) -> dict:
    """Dispatcher/Admin only (enforced again in ROLE_TOOLS below, not just
    here). No dedicated endpoint — filters the full order list client-side
    by status=DEFERRED, same documented shortcut as get_order_status."""
    orders = await _get("/api/orders", jwt)
    deferred = [o for o in orders if o.get("status") == "DEFERRED"]
    return {"count": len(deferred), "orders": deferred}


async def get_notifications(args: dict, jwt: str, role: str) -> dict:
    """args: {} — GET /api/notifications is already scoped to the caller
    (direct + role+depot broadcasts) by NotificationService.listForUser."""
    return {"notifications": await _get("/api/notifications", jwt)}


async def get_system_health(args: dict, jwt: str, role: str) -> dict:
    """Admin only (enforced in ROLE_TOOLS below). GET /api/admin/health —
    row counts for users, vehicles, orders, plans, trips, deliveries,
    receipts and sync events. The endpoint itself is @PreAuthorize ADMIN,
    so this also fails server-side for any other caller."""
    return await _get("/api/admin/health", jwt)


async def get_audit_log(args: dict, jwt: str, role: str) -> dict:
    """Admin only. args: {"limit": 20}. GET /api/admin/audit-logs — recent
    system actions (sign-ins, writes, AI tool calls) across every role."""
    limit = args.get("limit", 20)
    return {"entries": await _get("/api/admin/audit-logs", jwt, params={"limit": limit})}


async def get_users(args: dict, jwt: str, role: str) -> dict:
    """Admin only. GET /api/admin/users — account list (no passwords)."""
    return {"users": await _get("/api/admin/users", jwt)}


async def get_fleet(args: dict, jwt: str, role: str) -> dict:
    """Admin only (by role scoping here; the endpoint itself is open to any
    authenticated role). GET /api/vehicles — the vehicle roster and specs."""
    return {"vehicles": await _get("/api/vehicles", jwt)}


TOOL_IMPLEMENTATIONS = {
    "get_order_status": get_order_status,
    "get_today_trips": get_today_trips,
    "get_deferred_orders": get_deferred_orders,
    "get_notifications": get_notifications,
    "get_system_health": get_system_health,
    "get_audit_log": get_audit_log,
    "get_users": get_users,
    "get_fleet": get_fleet,
}

TOOL_SPECS = {
    "get_order_status": {
        "description": "Look up one order's current status and details by its order code.",
        "args": {"order_code": "string, e.g. ORD-20261002-0001"},
    },
    "get_today_trips": {
        "description": "List trips/tasks for a given date, scoped to the caller's depot and role.",
        "args": {"date": "string, ISO date e.g. 2026-10-02"},
    },
    "get_deferred_orders": {
        "description": "List all currently deferred orders network-wide, with their deferral reasons.",
        "args": {},
    },
    "get_notifications": {
        "description": "List the caller's recent in-app notifications.",
        "args": {},
    },
    "get_system_health": {
        "description": "System row counts: users, vehicles, orders, plans, trips, deliveries, receipts, sync events.",
        "args": {},
    },
    "get_audit_log": {
        "description": "Recent audit log entries: sign-ins, writes and AI tool calls across every role.",
        "args": {"limit": "integer, default 20"},
    },
    "get_users": {
        "description": "List user accounts: username, full name, role, depot/outlet, active status.",
        "args": {},
    },
    "get_fleet": {
        "description": "List vehicles: code, type, temperature capability, capacity, fuel and depot.",
        "args": {},
    },
}

# Role -> allowed tool names. Defense-in-depth only on the Python side — the
# real access boundary is the forwarded JWT hitting Spring Security on
# every backend call a tool makes.
#
# ADMIN gets system-administration tools only (health, audit, users, fleet),
# not the operational Dispatcher tools (orders, trips, deferrals) — the
# admin assistant answers "is the system healthy / who has access" questions,
# not "where is order X", which belongs to the role that owns that order flow.
ROLE_TOOLS: dict[str, list[str]] = {
    "DISPATCHER": ["get_order_status", "get_today_trips", "get_deferred_orders", "get_notifications"],
    "ADMIN": ["get_system_health", "get_audit_log", "get_users", "get_fleet", "get_notifications"],
    "LOADER": ["get_order_status", "get_today_trips", "get_notifications"],
    "DRIVER": ["get_order_status", "get_today_trips", "get_notifications"],
    "STORE_MANAGER": ["get_order_status", "get_notifications"],
}


def allowed_tools_for_role(role: str) -> list[str]:
    return ROLE_TOOLS.get(role.upper(), [])

async def record_tool_call(jwt: str, tool: str, outcome: str, args: dict) -> None:
    """Writes one audit row per tool call. A failed audit write must never break the chat reply."""
    try:
        async with httpx.AsyncClient(base_url=settings.backend_base_url, timeout=5.0) as client:
            await client.post(
                "/api/audit/ai-tool-calls",
                headers={"Authorization": f"Bearer {jwt}"},
                json={"tool": tool, "result": outcome, "arguments": json.dumps(args)[:500]},
            )
    except httpx.HTTPError:
        return
