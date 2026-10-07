# Map Mass

![Illustration of Malta and Gozo with church markers](public/og-image.png)

Map Mass is a map-first web application for finding Catholic churches and Mass times across Malta and Gozo. It combines a stylized 2.5D island map with a normalized church schedule, live Mass status, church search, bookmarks, photos, and selected custom 3D church models.

The application is a static, client-side Vite project. It has no backend or account system: church and schedule data are bundled with the build, while bookmarks are stored in the browser.

## Current features

- Malta- and Gozo-centred MapLibre map using OpenFreeMap's OpenStreetMap-derived tiles.
- An initial and reset overview that fits the complete island coastline as large as possible within the current viewport.
- Constrained pan and zoom, disabled rotation, and a whole-island reset control.
- Zoom-dependent 2.5D building extrusions from approximately zoom level `13.5`.
- Red cross markers for churches with Mass schedules and orange cross markers for churches without them.
- A map toggle for showing or hiding churches without Mass times.
- Live remaining-time pie indicators and 15-minute starting-soon hourglasses evaluated in the `Europe/Malta` time zone.
- A searchable church index covering church names, local names, localities, and addresses.
- An empty-search menu grouped into the next five distinct Mass time slots.
- Expandable time groups listing each church, locality, and Mass language.
- Local browser bookmarks, shown in the empty-search menu.
- Church detail cards with photos, church type, language tabs, weekly schedules, notes, and Google Maps links.
- Deep links using four-digit church paths such as `/0042`.
- Custom Three.js church models for church IDs `0006`, `0023`, `0042`, `0046`, `0057`, `0109`, `0230`, `0246`, and `0260`.
- Responsive desktop and mobile layouts and reduced-motion-aware map transitions.

## How the interface works

### Island overview and reset

On the home page, the map fits Malta, Gozo, Comino, and the offshore islets to the available screen space. It uses the island coastline rather than an enclosing rectangle of sea, centres the visible outline, and preserves the 50-degree pitch and -18-degree bearing. Small margins leave room for the search field, controls, and footer.

The overview zoom also becomes the minimum zoom. Resizing the window or changing device orientation recalculates the overview and camera limits; if the map is currently at the overview, it adjusts immediately to the new screen size.

The red reset button returns to this fitted overview, closes church details, restores the home URL `/`, and hides churches without Mass times again. Opening a church deep link instead selects that church after the data loads.

### Map markers and live Mass status

Every church with valid coordinates has a map marker. Churches with Mass schedules use red crosses; churches without schedules use orange crosses, hidden by default. The toggle below the reset control shows or hides the orange markers. Those churches remain available through search and direct links while their map markers are hidden.

Clicking or focusing a cross opens its detail bubble immediately; hovering with a mouse opens it after about one second. An unpinned bubble closes after about five seconds. Clicking the card or selecting the church from search zooms to the maximum map zoom of `18`, centres the church, pins the card to the right side of the viewport, and updates the URL. Clicking the map background dismisses the open card.

A red-and-white pie indicator appears above a church while a Mass is in progress. Its white remaining-time slice shrinks as the red elapsed portion grows clockwise from the top. Hovering over the indicator shows an estimated number of minutes remaining. If Masses overlap at one church, the estimate follows the earliest ending active Mass. An hourglass appears during the 15 minutes before the next Mass starts and switches to the pie at the start. Clicking either indicator selects the church directly. A Mass in progress takes priority over an upcoming Mass.

The current implementation estimates each Mass as lasting 60 minutes and refreshes live status every 30 seconds. Both indicators sit above ordinary church markers so nearby crosses do not obscure them. Active timetable entries are highlighted in the church detail card.

### Search and upcoming Masses

Typing in the search field returns up to eight ranked church matches. Focusing or clicking the empty field opens a menu with the next five distinct Mass time slots, followed by any bookmarked churches. The first time group is expanded initially; expanding another group reveals its churches and combines multiple languages for the same church and time. The open empty-search menu refreshes every 30 seconds.

Selecting a church from search, an upcoming time group, or bookmarks uses the same zoom and detail-card interaction as clicking a marker's detail card or status indicator.

Arrow keys navigate church results, Enter selects the active result, and Escape closes the menu. Activating search closes the current church detail card.

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
| Deployment model | Static files in `dist/`, with Cloudflare Workers assets configured in `wrangler.jsonc` |

The main startup flow is:

1. Create the Malta map, calculate the fitted island overview and camera limits, and load the base style. Start fetching the church workbook in parallel.
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
references/map/                 Source coastline geometry and attribution
src/
  data/                         Workbook normalization, schedules, photos, bookmarks
  map/
    church-models/              Registered Three.js church models
    add-building-layer.js       2.5D OpenStreetMap buildings
    add-church-marker.js        Marker interaction, lazy cards, and live indicators
    add-church-models-layer.js  MapLibre/Three.js integration
    create-map.js               Map configuration and viewport resize handling
    home-view.js                Coastline fitting, minimum zoom, and pan limits
    island-outline.js           Mercator convex hull used to fit the islands
    malta_all_church_mass_times.xlsx
  ui/
    church-details.js          Detail cards, language tabs, bookmarks, live highlights
    church-navigation.js       Church selection, camera movement, URLs, and history
    church-search.js           Search, bookmarks, and upcoming time groups
  main.js                       Application startup and module wiring
  styles.css                    Application styles
tests/                          Navigation, Mass status, and coastline projection checks
wrangler.jsonc                  Cloudflare Workers assets and SPA routing
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

Run the existing automated checks with:

```bash
node --test tests/*.test.js
```

These cover church navigation and history, Mass timing and indicators, and complete coastline fitting across desktop, tablet, and mobile viewport sizes.

If Vite retains an outdated dependency cache after a MapLibre upgrade, stop the development server and restart with:

```bash
npm run dev -- --force
```

## Static deployment

The repository configures Cloudflare Workers static assets in `wrangler.jsonc`, serving `dist/` on the custom domain `mass.catholic.mt`. Its `single-page-application` fallback serves `index.html` for church deep links.

For Cloudflare Pages or another static host, use:

- Build command: `npm run build`
- Output directory: `dist`

The app does not configure an API key for the OpenFreeMap base map.

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

The island overview uses public domain geoBoundaries Malta coastline geometry. The pinned source and attribution are documented in [references/map/README.md](references/map/README.md).

## 中文简介

Map Mass 是一个以地图为核心的网页应用，用于查找马耳他和戈佐岛的天主教堂及弥撒时间。项目为纯前端静态应用，不需要账户；教堂和弥撒数据随项目构建，收藏则保存在当前浏览器中。

### 主要功能

- 在地图上查看教堂位置，部分教堂提供自定义 3D 模型和照片。
- 查看每座教堂的每周弥撒时间、语言、备注和 Google Maps 链接。
- 自动显示正在进行的弥撒，以及接下来五个弥撒时间段。
- 用白色剩余时间扇形显示正在进行的弥撒，并在开始前 15 分钟显示沙漏。
- 按教堂名称、当地名称、地区或地址搜索。
- 在浏览器中收藏常用教堂。
- 通过 `/0042` 这类四位教堂编号链接直接打开教堂详情。
- 支持桌面端和移动端界面，初始视图与重置视图会根据屏幕尺寸尽可能放大并完整显示群岛。

### 基本用法

在地图上点击红色十字标记会立即打开教堂信息气泡；使用鼠标时，也可以在红十字上悬停约 1 秒打开气泡。若没有继续操作，未固定的气泡会在约 5 秒后自动关闭。点击气泡后，地图会缩放到最大级别 `18` 并居中到该教堂，详情卡会固定在页面右侧，同时网址会更新为该教堂的四位编号链接。通过顶部搜索框、即将开始的弥撒列表或收藏选择教堂，也会触发相同的定位和详情展示效果。点击地图背景可关闭当前详情卡。

没有弥撒时间的教堂使用橙色十字标记，默认隐藏；点击重置按钮下方的开关可显示这些标记。即使标记隐藏，也能通过搜索或教堂链接打开其详情。

聚焦或点击空搜索框时，会显示接下来五个弥撒时间段和已收藏的教堂。第一个时间段默认展开，各组会合并同一教堂同一时间的多种语言；打开的列表每 30 秒刷新一次。

红白圆饼表示该教堂当前有弥撒正在进行，白色扇形随着预计剩余时间减少而缩小；沙漏表示弥撒将在 15 分钟内开始。点击任一图标会直接定位到教堂并打开详情。弥撒时长统一按 60 分钟估算，状态每 30 秒刷新一次，详情卡中的当前弥撒时间也会高亮。

首次打开首页或点击右上角红色重置按钮时，地图会按当前屏幕尺寸完整显示马耳他、戈佐、科米诺及周边小岛，并在保留倾斜视角和控件边距的前提下尽可能放大。窗口尺寸变化或横竖屏切换时会重新计算适配；处于全岛视图时会立即调整。重置还会关闭详情卡、返回首页网址 `/`，并重新隐藏没有弥撒时间的教堂标记。

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
