# Map Mass

![alt text](public/og-image.png)

Map Mass is a map-first web application for finding Catholic churches and Mass times across Malta and Gozo. It combines a stylized 2.5D island map with a normalized church schedule, live Mass status, church search, bookmarks, photos, and selected custom 3D church models.

The application is a static, client-side Vite project. It has no backend or account system: church and schedule data are bundled with the build, while bookmarks are stored in the browser.

## Current features

- Malta- and Gozo-centred MapLibre map using OpenFreeMap's OpenStreetMap-derived tiles.
- Constrained pan and zoom, disabled rotation, and a whole-island reset control.
- Zoom-dependent 2.5D building extrusions from approximately zoom level `13.5`.
- Red cross markers for churches with Mass schedules and orange cross markers for churches without them.
- A map toggle for showing or hiding churches without Mass times.
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

Every church with valid coordinates is represented on the map. Churches with Mass schedules use red crosses, while churches without Mass schedules use orange crosses. The toggle below the whole-island control shows or hides the orange markers. Hovering over a marker reveals its detail card; clicking the card or selecting the church elsewhere in the interface zooms to the maximum map zoom, centres the church, and pins the detail card to the right side of the viewport.

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

The workbook must contain `Churches` and `Mass Times` worksheets. During startup, the browser reads and normalizes both worksheets. Every church with a non-empty ID and finite latitude and longitude values is published. A church without a valid Mass record remains available as an orange marker and has a detail card without a timetable.

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

## 中文简介

Map Mass 是一个以地图为核心的网页应用，用于查找马耳他和戈佐岛的天主教堂及弥撒时间。项目为纯前端静态应用，不需要账户；教堂和弥撒数据随项目构建，收藏则保存在当前浏览器中。

### 主要功能

- 在地图上查看教堂位置，部分教堂提供自定义 3D 模型和照片。
- 查看每座教堂的每周弥撒时间、语言、备注和 Google Maps 链接。
- 自动显示正在进行的弥撒，以及接下来五个弥撒时间段。
- 按教堂名称、当地名称、地区或地址搜索。
- 在浏览器中收藏常用教堂。
- 通过 `/0042` 这类四位教堂编号链接直接打开教堂详情。
- 支持桌面端和移动端界面。

### 基本用法

在地图上点击红色十字标记会立即打开教堂信息气泡；使用鼠标时，也可以在红十字上悬停约 1 秒打开气泡。若没有继续操作，气泡会在约 5 秒后自动关闭。点击气泡后，地图会缩放并居中到该教堂，详情卡会固定在页面右侧，同时网址会更新为该教堂的四位编号链接。通过顶部搜索框、即将开始的弥撒列表或收藏选择教堂，也会触发相同的定位和详情展示效果。

搜索框为空时，会显示即将开始的弥撒和已收藏的教堂。圣杯图标表示该教堂当前有弥撒正在进行；点击圣杯图标也会直接定位到教堂并打开详情。

本地运行需要 Node.js 20.19 或更高版本以及 npm：

```bash
npm install
npm run dev
```

创建并预览生产版本：

```bash
npm run build
npm run preview
```

生产文件会生成在 `dist/` 目录。底图和地图瓦片来自在线服务，因此使用时需要网络连接。
