# Map Mass

Map Mass is a map-first web application for finding Catholic churches and Mass times across Malta and Gozo. It combines a stylized 2.5D island map with a normalized church schedule, live Mass status, church search, bookmarks, photos, and selected custom 3D church models.

The application is a static, client-side Vite project. It has no backend or account system: church and schedule data are bundled with the build, while bookmarks are stored in the browser.

## Current features

- Malta- and Gozo-centred MapLibre map using OpenFreeMap's OpenStreetMap-derived tiles.
- Constrained pan and zoom, disabled rotation, and a whole-island reset control.
- Zoom-dependent 2.5D building extrusions from approximately zoom level `13.5`.
- Red cross markers for churches with listed Mass schedules and valid coordinates.
- Live Mass-in-progress indicators evaluated in the `Europe/Malta` time zone.
- A searchable church index covering church names, local names, localities, and addresses.
- An empty-search menu grouped into the next five distinct Mass time slots.
- Expandable time groups listing each church, locality, and Mass language.
- Local browser bookmarks, shown in the empty-search menu.
- Church detail cards with photos, church type, language tabs, weekly schedules, notes, and Google Maps links.
- Deep links using four-digit church paths such as `/0042`.
- Custom Three.js church models for church IDs `0006`, `0042`, `0046`, `0246`, and `0260`.
- Responsive desktop and mobile layouts and reduced-motion-aware map transitions.

## How the interface works

### Map markers and live Mass status

Every published church is represented by a red cross. Hovering over a marker reveals its Mass card; clicking the card or selecting the church elsewhere in the interface zooms to the maximum map zoom, centres the church, and pins the detail card to the right side of the viewport.

A chalice indicator appears above a church while a Mass is in progress. The current implementation treats each Mass as lasting 60 minutes and refreshes live status every 30 seconds. Active indicators are layered above ordinary church markers so nearby crosses do not obscure them.

### Search and upcoming Masses

Typing in the search field returns up to eight ranked church matches. With the field empty, the menu shows the next five distinct Mass time slots. Expanding a slot reveals its churches and combines multiple languages for the same church and time.

Selecting a church from search, an upcoming time group, or bookmarks uses the same map interaction as selecting a marker.

### Church details

Church detail cards can include:

- English and local church names;
- locality and church type;
- a church photo when one is available;
- a weekly Mass timetable;
- separate language tabs for multilingual schedules;
- schedule notes;
- a Google Maps link; and
- a local bookmark control.

Direct church URLs use the stable four-digit ID. Browser back and forward navigation restores the corresponding map state.

## Data

The application loads its data from:

```text
src/map/malta_all_church_mass_times.xlsx
```

The workbook must contain `Churches` and `Mass Times` worksheets. During startup, the browser reads and normalizes both worksheets. A church is published only when:

- its `Schedule status` is `Listed`;
- it has at least one valid Mass record; and
- it has finite latitude and longitude values.

Church IDs are normalized to four digits. Duplicate Mass records are removed using church, weekday, time, language, and note. Consecutive weekdays with identical schedules are combined for display.

Current schedule records use weekday, time, language, and optional note fields. The application evaluates all time-sensitive behavior in `Europe/Malta` rather than the viewer's local time zone.

Seasonal schedules, feast days, public holidays, temporary cancellations, and other date-specific exceptions are not yet modeled automatically and must be handled through data maintenance.

## Church photos

Runtime church photos live under `references/church-photos/` and use this naming convention:

```text
references/church-photos/<church-id>/<church-id>.<extension>
```

For example:

```text
references/church-photos/0042/0042.jpg
references/church-photos/0246/0246.png
```

Supported extensions are `.jpg`, `.jpeg`, `.png`, `.webp`, and `.avif`. The folder name and file name must contain the same four-digit church ID. Other images in these folders are treated only as modeling references and are not included as church-card photos.

## Custom 3D church models

Custom models are implemented as lightweight Three.js geometry rather than external model files. Each model has its own directory:

```text
src/map/church-models/<church-id>/
  config.js
  create-model.js
```

Models are registered in `src/map/church-models/registry.js` and loaded asynchronously after the main map is ready. Shared geometry, material, and disposal helpers live in `src/map/church-models/shared/`.

To add another model:

1. Create a directory named with the four-digit church ID.
2. Add `config.js` and `create-model.js` following an existing model.
3. Register the configuration in `registry.js`.
4. Add a matching runtime photo if the church card should display one.
5. Verify the model's position, scale, rotation, and visibility at supported zoom levels.

## Technical design

| Area | Current implementation |
| --- | --- |
| Application tooling | Vite 8 |
| UI | Vanilla JavaScript and CSS |
| Map engine | MapLibre GL JS |
| Base map | OpenFreeMap bright style and planet vector source |
| 3D rendering | MapLibre fill extrusions and a custom Three.js layer |
| Workbook reader | `read-excel-file` |
| Schedule time zone | `Europe/Malta` |
| Client persistence | `localStorage` for church bookmarks |
| Deployment model | Static files generated in `dist/` |

The main startup flow is:

1. Create the Malta map and load the base style.
2. Add the 2.5D building layer.
3. Load and normalize the church workbook.
4. Add church markers and initialize search.
5. Restore any church deep link from the current URL.
6. Refresh current-Mass state every 30 seconds.
7. Load registered custom church models asynchronously.

## Project structure

```text
public/                         Static branding and favicon assets
references/church-photos/       Runtime church photos and modeling references
src/
  data/                         Workbook normalization, schedules, photos, bookmarks
  map/
    church-models/              Registered Three.js church models
    add-building-layer.js       2.5D OpenStreetMap buildings
    add-church-marker.js        Church markers and detail cards
    add-church-models-layer.js  MapLibre/Three.js integration
    create-map.js               Map configuration and Malta camera limits
    malta_all_church_mass_times.xlsx
  ui/church-search.js           Search, bookmarks, and upcoming time groups
  main.js                       Application startup and URL synchronization
  styles.css                    Application styles
```

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

The production site is written to `dist/`. The base map requires an internet connection because map styles and vector tiles are loaded from OpenFreeMap.

If Vite retains an outdated dependency cache after a MapLibre upgrade, stop the development server and restart with:

```bash
npm run dev -- --force
```

## Static deployment

For Cloudflare Pages or another static host, use:

- Build command: `npm run build`
- Output directory: `dist`

No API key is currently required for the OpenFreeMap base map. Production deployments should review the tile provider's current usage policy and capacity expectations.

Deep links such as `/0042` require the host to serve `index.html` as the fallback for unknown paths.

## Current limitations

- Schedule data is bundled into the application and requires a rebuild to publish corrections.
- There is no administration interface, backend, authentication, or cross-device bookmark sync.
- Current-Mass duration is fixed at 60 minutes for every schedule entry.
- Date-specific exceptions and seasonal schedules are not evaluated automatically.
- Only selected churches have custom 3D models and runtime photos.
- Building geometry and height depend on upstream OpenStreetMap data.
- Overlapping markers are prioritized by UI layer order rather than geographic clustering.

## Attribution

Map Mass uses MapLibre GL JS, OpenFreeMap, and map data derived from OpenStreetMap. Production attribution must remain visible and comply with the requirements of the map, tile, schedule-data, and church-photo sources.
