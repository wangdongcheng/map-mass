# Map Mass

Map Mass is a map-first web application for discovering Catholic churches and Mass times across Malta and Gozo. Its central idea is to turn a conventional timetable into a living island view: churches are placed in a stylized 2.5D Malta, and relevant Mass events appear above them automatically according to the real local time.

The project is currently at the first prototype stage. The island map, navigation constraints, and 2.5D building layer are implemented. Church data, normalized schedules, and live event notifications are planned next.

## Product vision

The finished experience should:

- Open directly on a recognizable whole-island view of Malta and Gozo.
- Use a warm, slightly cartoon-like or clay-like visual language instead of a purely technical GIS appearance.
- Show ordinary buildings as 2.5D blocks while making churches visually distinct.
- Allow zooming and panning, while keeping map rotation disabled for a predictable overhead presentation.
- Let users select a church to see its parish, address, languages, and complete Mass schedule.
- Evaluate schedules against the current time in `Europe/Malta`.
- Raise a clear event card above a church when a Mass is approaching, starting, or currently relevant.
- Remain useful on both desktop and mobile screens.

The map is not intended to be a driving-navigation product. It is an ambient, visual way to answer questions such as “Where is the next Mass near me?” and “Which churches have Mass soon?”

## Current prototype

The first version provides:

- A Vite and vanilla JavaScript application.
- Map rendering with MapLibre GL JS.
- OpenStreetMap-derived vector tiles and styles provided by OpenFreeMap.
- A constrained Malta-centered camera with zoom and pan support.
- Rotation disabled for mouse and touch interaction.
- 2.5D building extrusion when zooming into populated areas.
- A whole-island reset button.
- Responsive controls, loading feedback, and a production build suitable for static hosting.
- An explicitly bundled MapLibre worker for reliable Vite development and production builds.

Buildings begin to rise at approximately zoom level `13.5`. The initial whole-island view intentionally remains flatter and less cluttered.

## Planned user experience

### Church layer

Each church will have a stable identifier, coordinates, display name, parish or locality, denomination or rite where relevant, and optional presentation metadata. Churches should remain recognizable at useful zoom levels without overwhelming the base map.

Important churches may eventually use simplified custom 3D models. The first implementation should use lightweight symbols, highlighted footprints, or markers so that the island remains fast on ordinary phones.

### Mass-time events

Schedules will be stored as structured data rather than embedded in presentation code. A client-side scheduler can initially compare the current Malta time with the normalized records and generate map events.

An event may have states such as:

- `upcoming`: begins within a configurable time window.
- `starting`: begins now or within a few minutes.
- `in_progress`: currently taking place when duration is known or estimated.
- `finished`: no longer displayed as an active event.

To avoid a screen full of overlapping cards, the interface should prioritize the nearest upcoming events, cluster or suppress lower-priority notices, and reveal full information after a user selects a church.

### Suggested schedule record

```json
{
  "churchId": "mt-valletta-st-john",
  "dayOfWeek": "Sunday",
  "time": "10:30",
  "language": "Maltese",
  "season": "all-year",
  "notes": null,
  "source": {
    "url": "https://example.org/church-schedule",
    "checkedAt": "2026-09-28"
  }
}
```

Future data rules will need to account for Sunday and weekday schedules, vigils, feast days, seasonal changes, public holidays, language, temporary cancellations, and source verification dates.

## Data strategy

The intended church list and Mass schedules will be assembled from public church or parish information, including the Malta results listed by MassHour where its terms permit. OpenStreetMap can provide church locations and building geometry, but schedule information must be normalized and verified separately.

Every schedule should retain its source and last verification date. Parish-maintained information should take precedence when sources disagree. Before automated collection or republication, the relevant website terms, attribution requirements, and data permissions must be reviewed.

The prototype can begin with version-controlled JSON files. A later release may introduce an authenticated administration interface and database so schedule corrections can be published without rebuilding the frontend.

## Technical design

| Area | Current choice | Purpose |
| --- | --- | --- |
| Application tooling | Vite | Fast local development and static production builds |
| UI code | Vanilla JavaScript and CSS | Keeps the first version small and framework-independent |
| Map engine | MapLibre GL JS | WebGL map rendering, vector styling, markers, and 2.5D extrusion |
| Base map | OpenFreeMap | Hosted OpenStreetMap-derived vector tiles and map style |
| Building effect | `fill-extrusion` layer | Converts building attributes into 2.5D blocks |
| Time zone | `Europe/Malta` | Ensures event evaluation follows real Malta local time |
| Initial hosting target | Cloudflare Pages | Static deployment with global caching |

The intended data flow is:

1. Load the base map and 2.5D building layer.
2. Load normalized church and schedule data.
3. Convert recurring schedules into occurrences for the current Malta date.
4. Determine which occurrences are upcoming or active.
5. Render church symbols and prioritized event cards on the map.
6. Re-evaluate at a small interval and after visibility or time-zone changes.

## Proposed project structure

```text
src/
  data/
    churches.json
    mass-times.json
  map/
    create-map.js
    add-building-layer.js
    add-church-layer.js
  schedule/
    normalize-schedule.js
    get-current-events.js
  ui/
    church-popup.js
    event-marker.js
  main.js
```

Only the files required by the current prototype exist today. The remaining modules describe the planned separation of map rendering, schedule logic, data, and UI.

## Roadmap

### Phase 1 — Map foundation

- [x] Create the Vite application.
- [x] Center and constrain the map around Malta and Gozo.
- [x] Add OpenStreetMap-derived base-map data.
- [x] Add zoom-dependent 2.5D buildings.
- [x] Support pan and zoom while disabling rotation.
- [x] Configure the MapLibre worker for Vite.

### Phase 2 — Churches

- [ ] Build and verify the Malta church inventory.
- [ ] Geocode and manually review church coordinates.
- [ ] Add a dedicated church source and map layer.
- [ ] Add church detail popups and locality filtering.

### Phase 3 — Mass schedules

- [ ] Define the normalized schedule schema.
- [ ] Import Mass-time records with source metadata.
- [ ] Handle weekday, Sunday, vigil, seasonal, and exceptional schedules.
- [ ] Add validation and duplicate detection.

### Phase 4 — Live map events

- [ ] Evaluate events using real `Europe/Malta` time.
- [ ] Display upcoming and starting Mass notices above churches.
- [ ] Resolve overlapping notices with prioritization and clustering.
- [ ] Add language, distance, and time-window filters.

### Phase 5 — Visual and operational polish

- [ ] Develop the clay-like color palette and custom church presentation.
- [ ] Improve mobile performance and accessibility.
- [ ] Add an administration workflow for schedule corrections.
- [ ] Add data freshness monitoring and source review reminders.

## Local development

Requirements:

- Node.js 20.19 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```

The generated static site is written to `dist/`.

If Vite retains an outdated dependency cache after a MapLibre upgrade, stop the development server, delete `node_modules/.vite`, and restart with:

```bash
npm run dev -- --force
```

## Cloudflare Pages

Use these build settings:

- Build command: `npm run build`
- Build output directory: `dist`

No API key is required for the current OpenFreeMap-based prototype. Production usage should still review the selected tile provider's service policy and capacity expectations.

## Current limitations

- The repository does not yet contain the verified church inventory or Mass-time dataset.
- Church-specific markers and event cards are not implemented yet.
- The current style is a functional visual foundation, not the final clay-art direction.
- Building height and completeness depend on upstream OpenStreetMap data.
- The prototype has no backend, account system, or schedule editor.

## Attribution

This application uses MapLibre GL JS and map data derived from OpenStreetMap through OpenFreeMap. Final production attribution must remain visible and comply with the requirements of all map, tile, and schedule-data providers.
