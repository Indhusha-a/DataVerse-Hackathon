# Waypoint frontend

The web application for all four Waypoint roles (Dispatcher, Loader, Driver, Store Manager) plus the Admin area. It is a React single-page app that talks to the Spring Boot backend over `/api` and to the AI service over `/chat`.

It reuses the Designathon design system (tokens, components, icons, route structure) and replaces the prototype's mock data with the live API. Driver and Loader screens are built mobile-first; the Driver flow keeps working offline.

For the system as a whole (architecture, lifecycles, planning rules, seeded accounts, judge walkthrough) see the [project README](../README.md).

---

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19, TypeScript, Vite 8 |
| Routing | react-router-dom 7 |
| State | zustand 5 (auth session, UI, offline sync queue) |
| Styling | Tailwind CSS v4 through `@tailwindcss/vite`, tokens in `src/index.css` (`@theme`) |
| Motion | framer-motion |
| Icons | lucide-react |

No form library, no UI kit and no test framework. Forms are plain controlled inputs with validation that mirrors the backend rules.

---

## Run it

You need Node 20 or later, and the backend running (see below).

```bash
cd hackathon/frontend
npm install
npm run dev
```

Open http://localhost:5173.

The dev server proxies requests, so the browser never calls the backend cross-origin:

| Path | Proxied to | Override |
|---|---|---|
| `/api/*` | Spring Boot backend, `http://localhost:8080` | `VITE_BACKEND_URL` |
| `/chat`, `/health` | AI service, `http://localhost:8000` | `VITE_AI_URL` |

Set the variables in the shell or in a `.env.local` file in this folder if the backend runs elsewhere.

### Full stack

Start the backend and its database first. From `hackathon/`:

```bash
docker compose up --build        # PostgreSQL, backend on :8080, AI service on :8000
```

Then run `npm run dev` in `frontend/`. Seeded accounts are listed in the [project README](../README.md#seeded-accounts). The AI assistant answers only if the AI service has an LLM key set in `hackathon/.env`. Without a key, the rest of the app works as normal.

Other scripts:

```bash
npm run build      # type-check (tsc -b) and production build into dist/
npm run preview    # serve the production build locally
```

---

## Layout

```
src/
  api/          client.ts (fetch wrapper, token, ApiError), endpoints.ts (one function per endpoint), types.ts
  store/        useAuthStore (session), useUiStore (operating date, simulated offline), useSyncQueue (offline queue)
  hooks/        useAsync / usePolling, useOnline, useDriverStops (merges server state with the local queue)
  lib/          dates (Asia/Colombo formatting), labels (status text and tones), trips, driverCache, alerts
  routes/       RequireRole guard
  components/
    common/     Badge, Button, Card, CapacityBar, Drawer, EmptyState, StatCard
    layout/     AppShell, Sidebar, Topbar, NotificationsPanel, OfflineBanner, PageHeader, navConfig
    logistics/  RouteTimeline, StatusBadge, TripProgressCard
    ai/         AIAssistant (floating panel, POST /chat)
    common/RouteArt.tsx   SVG route map used as the landing hero when no photo is supplied
  pages/
    landing/ auth/ dispatcher/ loader/ driver/ store/ admin/
```

---

## Routes

Each role lands on its own home page after sign-in. A user who opens another role's page is redirected.

| Role | Screens |
|---|---|
| Dispatcher | `/dispatcher/dashboard`, `orders`, `planning`, `vehicles`, `trips`, `monitoring`, `deferred` |
| Loader | `/loader/dashboard`, `tasks`, `issues` |
| Driver | `/driver/dashboard`, `trip`, `stops`, `delivery`, `sync` |
| Store Manager | `/store/dashboard`, `orders`, `tracking` |
| Admin | `/admin/overview`, `users`, `fleet`, `audit`, `access` |

Public routes: `/` (landing) and `/login`.

The Admin area, the Driver sync queue and the deferral and history views were added after the Designathon. The remaining screens follow the Designathon prototype.

---

## Offline operation (Driver)

Drivers lose signal in the field, so the Driver screens are built to keep working:

1. **Route cache.** The driver's stops for the operating day are cached in `localStorage` under `waypoint.driverStops`. When the device is offline, the Dashboard, Trip and Stops screens read from the cache.
2. **Local queue.** When offline, "Arrived" and "Record delivery" are not sent. Each action is written to the queue under `waypoint.syncQueue` with a client-generated `eventId`, so replaying it is idempotent on the server.
3. **Overlay.** Queued actions are applied on top of the cached route, so the driver sees the arrival or delivery straight away, marked as waiting to sync.
4. **Replay.** When the connection returns, the queue is sent to `POST /api/sync/events` in one batch. Each event comes back as `SYNCED` or `CONFLICT`. Conflicts stay in the queue with the server's message, so the driver can see them on the Sync screen.
5. **Simulated offline.** The Topbar can switch the app to offline mode, which is useful for demonstrating the flow without disconnecting the device.

The Sync screen shows the local queue, the server's applied and conflict counts, and a "Sync now" action. It polls the server every 15 seconds while online.

**Vehicle selection.** Trips carry no driver assignment on the backend, so when more than one trip is dispatched at the depot at once, the dashboard asks the driver which vehicle they're on before showing a route. The choice is stored under `waypoint.driverTrip` (per operating date) and sent as `tripId` on every driver API call from then on. With only one active trip, this is automatic and invisible.

Only Driver arrivals and deliveries are queued. Planning, loading and store actions need a connection.

---

## Session and errors

- The JWT is stored in `localStorage` under `waypoint.token`, and the signed-in user under `waypoint.session`.
- When the API returns 401, the client clears the session and raises `SESSION_EXPIRED_EVENT`, so the app returns to the sign-in page.
- All API errors go through `errorMessage()`, which turns the backend's error body into one readable sentence for display.
- Storage access is wrapped in try/catch. Private windows and blocked storage fall back to in-memory state.

---

## Design system

Tokens live in `src/index.css` under `@theme`, carried over from the Designathon:

- **Navy** (`navy-950` to `navy-600`) for the dark chrome, the sidebar and the Driver summary card.
- **Brand** (indigo, `brand-50` to `brand-700`) for primary actions and active states.
- **Success, warning, danger, info** for status. Badges use six tones: neutral, brand, success, warning, danger, info.
- **Shadows** `--shadow-card` and `--shadow-panel`. Radii follow the Designathon: `rounded-lg` for controls, `rounded-xl` for banners and list items, `rounded-2xl` for cards, `rounded-full` for badges.
- Fonts: Inter for body text and Plus Jakarta Sans for headings, loaded from Google Fonts in `index.html`.

Motion is limited to fades on mount and spring transitions for the sidebar and drawers.

Icons are lucide-react throughout. Status labels and tones are centralised in `src/lib/labels.ts`, so the same status reads the same way on every screen.

---

## Landing page imagery

The landing hero looks for `public/images/hero.jpg`. If the file is missing, it shows `RouteArt`, a generated SVG route map, so the page is never blank. To use a photograph, add a licensed image at that path. See `public/images/README.md` for the expected size and the other images the page uses.

---

## Known limits

- **No fleet-wide route map.** The brief does not require one, and the dataset has no coordinates. Routes are shown as ordered stop lists with planned arrival and window close times. Each stop does have a turn-by-turn directions panel (see below).
- **Navigation uses the outlet's name and district, not stored coordinates.** The Navigate button embeds Google Maps' own key-less directions view inline, with the destination geocoded from outlet + district text. The origin is left unset, so Maps uses the driver's live device location as the start point — a real route, just not one built from dataset coordinates.
- **No GPS-based ETAs.** Arrival is recorded when the driver taps "Arrived". Times shown elsewhere (next stop, window close) are planned times, not live ETAs.
- **Proof of delivery is a reference.** The POD field stores a text reference to the signed form or photo. Files are not uploaded.
- **Build size.** The production bundle is about 570 kB before gzip (170 kB after). A warning is printed during the build. Route-level code splitting would remove it, but was not needed for this submission.
