`malta-boundary.geojson` is the public domain geoBoundaries gbOpen Malta ADM0
boundary (MLT-ADM0-38034468, source: geoBoundaries / Wikimedia Commons).

Source: https://www.geoboundaries.org/api/current/gbOpen/MLT/ADM0/

Pinned geometry: https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/MLT/ADM0/geoBoundaries-MLT-ADM0.geojson

The map fits the convex hull of this geometry, calculated in Mercator coordinates
and stored in `src/map/island-outline.js`. Projection tests check the complete
coastline, including small offshore islands, against the resulting camera.

## Church model references

Every registered church model has its own four-digit church ID directory under
`references/map/`, containing three files. For example:

```text
references/map/0202/
  0202-model-notes.md
  0202-model-preview.png
  0202-osm-context.geojson
```

The shared `malta-boundary.geojson` and this guide remain in `references/map/`.
Each church directory contains:

- `<id>-model-notes.md`: supplied image references, placement, orientation,
  architectural interpretation and the limits of the source evidence.
- `<id>-model-preview.png`: a rendering of the actual standalone Three.js model.
  Geographic rotation is omitted; each note describes the viewing direction.
- `<id>-osm-context.geojson`: pinned map geometry with source attribution.

The contexts added on 2026-10-09 contain complete OpenFreeMap building, road,
road-label, POI and land-use features intersecting a bounding box extending
160 m from the query centre. They record the source snapshot, tile URLs, fetch
time and query bounds. A neighbouring tile is fetched when the box crosses a
tile boundary. Polygon components of merged tile features have separate IDs;
these IDs are not OSM way IDs. Tile quantization, clipping and source merging
limit precision. Existing contexts for 0047, 0057, 0109 and 0177 retain their
original source geometry and identifiers.

For older models, newly exported context is a retrospective map reference,
not evidence that every implemented corner matches that source snapshot.
The notes distinguish implemented dimensions from map measurements and visual
estimates. Model previews are not used to load or display the live-map models.

From the repository root, regenerate selected artifacts with:

```sh
node scripts/export-model-context.mjs 0202
node scripts/render-model-previews.mjs 0202
```

Use Node.js 22 or newer for these maintenance scripts. Both commands accept
multiple four-digit church IDs, create their directories as needed, and overwrite
their target files in `references/map/<id>/`. The context exporter downloads the current OpenFreeMap snapshot and
pins its URLs in the output; review the notes and footprint tests after any
refresh. It uses the model's configured coordinates, falling back to the
workbook marker. The preview renderer starts a local Vite server and headless
Chromium browser, with no image-generation service. On Windows it discovers
Chrome or Edge; elsewhere set `MODEL_PREVIEW_BROWSER` to the browser executable.
Preview output is 1200 × 900 PNG. Neither command changes model geometry.
