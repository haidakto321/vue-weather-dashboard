# iframe + micro-frontend demo - design

Date: 2026-08-08
Status: approved (user said "go")

## Purpose

Study project purpose (per CLAUDE.md): each popular Vue/web pattern gets one obvious, visible
job. This adds `<iframe>` as that next pattern, via two demos:

1. **Simple embed** - OpenStreetMap map for a city, embedded in an existing page.
2. **Micro-frontend** - a genuinely separate mini Vue project, loaded via iframe into the main
   dashboard, communicating with it over `postMessage`.

User explicitly waived the "ask before adding scope beyond the agreed list" constraint in
CLAUDE.md for this work.

## 1. OSM map embed

New component `src/components/LocationMap.vue`, mounted on `CityDetailPage.vue` as a new card
(placed after the "Current conditions" card, before the forecast row).

Props: `latitude: number`, `longitude: number`, `name: string` (for the iframe `title` attr,
accessibility).

New pure helper `src/lib/osmEmbed.ts`:

```ts
export function buildOsmEmbedUrl(lat: number, lon: number): string
```

Builds a small bounding box (±0.05° around the point) and returns:

```
https://www.openstreetmap.org/export/embed.html?bbox={lonMin},{latMin},{lonMax},{latMax}&layer=mapnik&marker={lat},{lon}
```

No cross-origin messaging needed - this is a one-way embed, no data flows back.

## 2. Default-location micro-frontend

### Project layout

A genuinely separate npm project, sibling to the main app, not a workspace/monorepo package:

```
widgets/default-location-widget/
  package.json          # own deps: vue, vite, typescript - no vuetify, no pinia
  vite.config.ts
  tsconfig.json
  index.html
  .env                   # VITE_PARENT_ORIGIN=http://localhost:5173
  src/main.ts
  src/App.vue
  src/postMessage.ts     # isTrustedOrigin() pure helper
```

Deliberately bare styling (plain CSS, no Vuetify) - it should visually look like a different
project bolted on, which is an honest lesson about iframe composition (visual seams are the
default, not an accident).

Dev port: `5174` (main app stays on its default `5173`).

### Main-app side

New component `src/components/DefaultLocationWidget.vue`, mounted on `DashboardPage.vue`
(placed between `GeolocationButton` and the city card grid). Renders:

```html
<iframe :src="widgetUrl" sandbox="allow-scripts allow-same-origin" title="Default location widget" />
```

`widgetUrl` comes from `import.meta.env.VITE_WIDGET_URL`, set in the main app's
`.env.development` to `http://localhost:5174`.

New pure helper `src/lib/widgetMessages.ts`:

```ts
export function isTrustedOrigin(origin: string, allowed: string): boolean
```

Shared-shape helper reused by the message listener below (and mirrored, not imported, into the
widget project's own `src/postMessage.ts` - the two projects don't share code, by design).

### postMessage protocol

```
widget → parent   {type: 'widget:ready'}
                   sent once, on widget mount

parent → widget    {type: 'widget:init', cities: SavedCityLite[], defaultCityKey: string | null}
                   sent in response to 'widget:ready', via iframe.contentWindow.postMessage

widget → parent    {type: 'widget:set-default', cityKey: string}
                   sent when user clicks "Set as default" in the widget
```

`SavedCityLite` = `{key, name, latitude, longitude, admin1?, country?}` (subset of `SavedCity`).

Both directions validate `event.origin` against the known counterpart origin
(`isTrustedOrigin`) and check `event.data?.type` before trusting the payload. Untrusted-origin
or malformed messages are silently ignored (not thrown - a rogue/misconfigured origin should
not crash either app).

### Widget behavior

On receiving `widget:init`:
- Renders a `<select>` of the given cities.
- On selection, calls Open-Meteo directly (no shared lib with main app):
  ```
  GET https://api.open-meteo.com/v1/forecast
      ?latitude={lat}&longitude={lon}
      &daily=precipitation_probability_max,weathercode
      &forecast_days=2&timezone=auto
  ```
  Tomorrow = index `1` of the `daily` arrays.
- `isRainy = daily.precipitation_probability_max[1] >= 50`.
- If rainy: shows an in-page banner ("Rain expected tomorrow in {name}"). No browser
  Notification API (user chose in-page banner over real push notification).
- "Set as default" button sends `widget:set-default` with the selected city's key.

### Main-app state change

`src/types/preferences.ts`: add `defaultCityKey: string | null` to `Preferences`, default
`null`.

`src/stores/preferences.ts`: add `setDefaultCity(key: string | null)` action, same
`useLocalStorage` persistence pattern as existing setters. `sanitize()` accepts `string | null`,
anything else falls back to `null`.

`DefaultLocationWidget.vue`'s message listener, on a valid `widget:set-default`, calls
`preferencesStore.setDefaultCity(cityKey)` - but only if `cityKey` exists in
`citiesStore.cities` (defense against a stale/tampered key referencing a since-removed city).

`src/components/WeatherCard.vue`: small "Default" badge/chip shown when
`city.key === preferencesStore.defaultCityKey`.

## Explicit scope decisions (not gaps - deliberate)

- **No production build wiring.** The iframe `src` only resolves in dev (`localhost:5174`).
  Deploying the widget as a static asset reachable from a built main app is out of scope for a
  study project that isn't deployed.
- **No `concurrently` devDependency.** Two dev servers are started in two terminals. (Can be
  added later if the user wants a single `npm run dev:all`.)
- **No real Notification API.** In-page banner only, per user's explicit choice.
- **No test project for the widget itself.** The widget's own `isTrustedOrigin` check is ~3
  lines, not unit tested there. The security-relevant boundary (main app trusting a message) is
  the one covered by tests.

## Testing plan

Existing convention: flat spec files in `src/__tests__/*.spec.ts` (not colocated), Vitest.

- `src/__tests__/osmEmbed.spec.ts` - `buildOsmEmbedUrl` produces correct bbox/marker for sample
  coordinates.
- `src/__tests__/preferences.store.spec.ts` (extend existing file) - `setDefaultCity` persists
  through `useLocalStorage`; `sanitize()` falls back to `null` for a corrupt stored value.
- `src/__tests__/defaultLocationWidget.spec.ts` - mounts `DefaultLocationWidget.vue`, dispatches
  mock `MessageEvent`s: wrong-origin message is ignored (store unchanged), correct-origin
  `widget:set-default` with a valid city key calls `setDefaultCity`, an unknown city key is
  rejected.

No e2e/Playwright coverage added for this - the existing smoke suite is out of scope to extend
here (can revisit later).

## Out of scope for this spec (future ideas, not committed)

- Deploying the widget for production use.
- More than one micro-frontend widget.
- Widget picking a city not already saved in the main app (its own search).
